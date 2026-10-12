import { RTCPeerConnection, mediaDevices } from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import { BASE_URL } from '../../lib/apiConfig';
import { fetchIdentityKeys } from '../user/userKeys';
import { getPreferredAiPersona } from '../user/userPreferences';
import { fetchAIChatMessages, getAuthHeaders, organizeKeysByCategory, ChatMode } from '../features/affirmationService';
import { VoiceEventTracker, VoiceState, Turn } from './voiceEvents';
import { LevelExtractor, AudioLevels } from './voiceStats';

// Confirmed against the Realtime docs; if OpenAI moves it, this is the only place to change.
const REALTIME_CALLS_URL = 'https://api.openai.com/v1/realtime/calls';

const HISTORY_MESSAGES = 10;
const LEVEL_POLL_MS = 100;
const THINKING_WATCHDOG_MS = 15000;
const DISCONNECT_GRACE_MS = 6000;

export type VoiceErrorCode = 'pro_required' | 'voice_limit_reached' | 'mic_denied' | 'network' | 'server';

export class VoiceSessionError extends Error {
  code: VoiceErrorCode;
  constructor(code: VoiceErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export type EndReason = 'user' | 'max_duration' | 'background' | 'network' | 'error';

export interface VoiceSessionCallbacks {
  onState: (state: VoiceState) => void;
  onCaption: (caption: string | null) => void;
  onTurn: (turn: Turn) => void;
  onLevels: (levels: AudioLevels) => void;
  onEnded: (reason: EndReason, error?: VoiceSessionError) => void;
}

interface VoiceSessionGrant {
  client_secret: string;
  session_id: string;
  max_seconds: number;
  remaining_seconds: number;
}

const requestGrant = async (mode: ChatMode): Promise<VoiceSessionGrant> => {
  const [keys, persona, headers] = await Promise.all([
    fetchIdentityKeys(),
    getPreferredAiPersona(),
    getAuthHeaders(),
  ]);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/voice/session`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ mode, persona, keys: organizeKeysByCategory(keys || []) }),
    });
  } catch (e) {
    throw new VoiceSessionError('network', 'Could not reach the server.');
  }

  if (response.ok) return response.json();

  let code: string | undefined;
  try {
    code = (await response.json())?.detail?.code;
  } catch (e) {
    code = undefined;
  }
  if (response.status === 403 && code === 'pro_required') {
    throw new VoiceSessionError('pro_required', 'Voice is a Pro feature.');
  }
  if (response.status === 429 && code === 'voice_limit_reached') {
    throw new VoiceSessionError('voice_limit_reached', 'You have used today\'s voice time.');
  }
  throw new VoiceSessionError('server', 'Voice is unavailable right now.');
};

/**
 * One voice conversation: mic in, AI voice out, over a WebRTC connection straight to OpenAI.
 * Our server only mints the short-lived key, so audio never passes through it.
 */
export class RealtimeVoiceSession {
  private pc: RTCPeerConnection | null = null;
  private channel: any = null;
  private stream: any = null;
  private sessionId: string | null = null;
  private ended = false;
  private tracker = new VoiceEventTracker();
  private extractor = new LevelExtractor();
  private timers: ReturnType<typeof setTimeout>[] = [];
  private intervals: ReturnType<typeof setInterval>[] = [];
  private thinkingSince: number | null = null;
  private currentState: VoiceState = 'connecting';
  private statsBusy = false;

  constructor(private mode: ChatMode, private callbacks: VoiceSessionCallbacks) {}

  async start(): Promise<{ maxSeconds: number; remainingSeconds: number }> {
    this.setState('connecting');
    const grant = await requestGrant(this.mode);
    this.sessionId = grant.session_id;

    try {
      this.stream = await mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (e) {
      await this.closeServerSession();
      throw new VoiceSessionError('mic_denied', 'Microphone access is needed for voice.');
    }

    // Speaker, not earpiece; no proximity sensor since this isn't a phone call
    InCallManager.start({ media: 'audio', auto: false });
    InCallManager.setForceSpeakerphoneOn(true);

    const history = (await fetchAIChatMessages(this.mode)).slice(-HISTORY_MESSAGES);

    try {
      await this.connect(grant.client_secret, history);
    } catch (e) {
      await this.end('error');
      throw new VoiceSessionError('network', 'Could not start the voice connection.');
    }

    this.timers.push(setTimeout(() => this.end('max_duration'), grant.max_seconds * 1000));
    this.intervals.push(setInterval(() => this.pollLevels(), LEVEL_POLL_MS));
    this.intervals.push(setInterval(() => this.watchdog(), 1000));

    return { maxSeconds: grant.max_seconds, remainingSeconds: grant.remaining_seconds };
  }

  setMuted(muted: boolean) {
    this.stream?.getAudioTracks().forEach((track: any) => {
      track.enabled = !muted;
    });
  }

  async end(reason: EndReason, error?: VoiceSessionError) {
    if (this.ended) return;
    this.ended = true;

    this.timers.forEach(clearTimeout);
    this.intervals.forEach(clearInterval);
    try { this.channel?.close(); } catch (e) { /* already closed */ }
    try { this.pc?.close(); } catch (e) { /* already closed */ }
    this.stream?.getTracks().forEach((track: any) => track.stop());
    try { InCallManager.stop(); } catch (e) { /* audio session already released */ }

    this.setState('ended');
    this.callbacks.onLevels({ mic: 0, ai: 0 });
    this.callbacks.onEnded(reason, error);
    await this.closeServerSession();
  }

  private async connect(secret: string, history: { role: string; content: string }[]) {
    const pc = new RTCPeerConnection();
    this.pc = pc;

    this.stream.getAudioTracks().forEach((track: any) => pc.addTrack(track, this.stream));

    // The channel must exist before the offer is created, or it won't be negotiated
    const channel = pc.createDataChannel('oai-events');
    this.channel = channel;
    channel.onopen = () => this.primeConversation(history);
    channel.onmessage = (message: any) => this.handleMessage(message.data);

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        this.end('network', new VoiceSessionError('network', 'The voice connection was lost.'));
      } else if (pc.connectionState === 'disconnected') {
        // Brief drops often recover on their own
        this.timers.push(setTimeout(() => {
          if (pc.connectionState === 'disconnected') {
            this.end('network', new VoiceSessionError('network', 'The voice connection was lost.'));
          }
        }, DISCONNECT_GRACE_MS));
      }
    };

    const offer = await pc.createOffer({});
    await pc.setLocalDescription(offer);

    const answer = await fetch(REALTIME_CALLS_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/sdp' },
      body: offer.sdp,
    });
    if (!answer.ok) throw new Error(`Realtime connect failed: ${answer.status}`);

    await pc.setRemoteDescription({ type: 'answer', sdp: await answer.text() });
  }

  // Lets the voice AI remember what was said earlier in this mode, whether typed or spoken
  private primeConversation(history: { role: string; content: string }[]) {
    history.forEach(message => {
      this.send({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: message.role,
          content: [{ type: message.role === 'assistant' ? 'output_text' : 'input_text', text: message.content }],
        },
      });
    });
    this.setState('listening');
  }

  private send(event: object) {
    if (this.channel?.readyState === 'open') {
      this.channel.send(JSON.stringify(event));
    }
  }

  private handleMessage(raw: string) {
    let event: any;
    try {
      event = JSON.parse(raw);
    } catch (e) {
      return;
    }

    const out = this.tracker.handle(event);
    if (out.state) this.setState(out.state);
    if (out.caption !== undefined) this.callbacks.onCaption(out.caption);
    out.turns.forEach(turn => this.callbacks.onTurn(turn));
    if (out.error) {
      this.end('error', new VoiceSessionError('server', out.error));
    }
  }

  private setState(state: VoiceState) {
    if (state === this.currentState) return;
    this.currentState = state;
    this.thinkingSince = state === 'thinking' ? Date.now() : null;
    this.callbacks.onState(state);
  }

  private async pollLevels() {
    // Stats cross the native bridge as one JSON blob; never queue a second call behind a slow one
    if (!this.pc || this.statsBusy || this.ended) return;
    this.statsBusy = true;
    try {
      const report = await this.pc.getStats();
      this.callbacks.onLevels(this.extractor.update(report as Map<string, any>, Date.now()));
    } catch (e) {
      // A missed sample just means one frame without a level
    } finally {
      this.statsBusy = false;
    }
  }

  private watchdog() {
    if (this.thinkingSince !== null && Date.now() - this.thinkingSince > THINKING_WATCHDOG_MS) {
      const settled = this.tracker.settle();
      if (settled) this.setState(settled);
    }
  }

  private async closeServerSession() {
    const sessionId = this.sessionId;
    if (!sessionId) return;
    this.sessionId = null;
    try {
      await fetch(`${BASE_URL}/voice/session/end`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch (e) {
      // The server counts unclosed sessions at full length, so a missed call can't be exploited
    }
  }
}
