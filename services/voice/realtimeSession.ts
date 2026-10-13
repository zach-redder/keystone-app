import { RTCPeerConnection, mediaDevices } from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import { BASE_URL } from '../../lib/apiConfig';
import { fetchIdentityKeys } from '../user/userKeys';
import { getPreferredAiPersona } from '../user/userPreferences';
import { fetchCustomPersonalities } from '../features/customPersonalitiesService';
import { fetchAIChatMessages, getAuthHeaders, organizeKeysByCategory, ChatMode } from '../features/affirmationService';
import { VoiceEventTracker, VoiceState, Turn } from './voiceEvents';
import { LevelExtractor, AudioLevels } from './voiceStats';
import { pickPersonaVoice } from './personaVoice';

// Confirmed against the Realtime docs; if OpenAI moves it, this is the only place to change.
const REALTIME_CALLS_URL = 'https://api.openai.com/v1/realtime/calls';

const HISTORY_MESSAGES = 10;
const LEVEL_POLL_MS = 50;
const THINKING_WATCHDOG_MS = 15000;
const DISCONNECT_GRACE_MS = 6000;
// A request that hangs must fail into the retry screen instead of leaving "Connecting..." up forever
const GRANT_TIMEOUT_MS = 12000;
const SDP_TIMEOUT_MS = 10000;
const CHANNEL_OPEN_TIMEOUT_MS = 10000;
const CONNECT_ATTEMPTS = 2;
const RETRY_DELAY_MS = 400;

export type VoiceErrorCode =
  | 'pro_required'
  | 'voice_limit_reached'
  | 'mic_denied'
  | 'auth'
  | 'network'
  | 'server'
  | 'aborted';

export class VoiceSessionError extends Error {
  code: VoiceErrorCode;
  constructor(code: VoiceErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export type EndReason = 'user' | 'max_duration' | 'limit' | 'background' | 'network' | 'error';

export interface VoiceSessionCallbacks {
  onState: (state: VoiceState) => void;
  onCaption: (caption: string | null) => void;
  onTurn: (turn: Turn) => void;
  onRemainingMessages: (remaining: number) => void;
  onLevels: (levels: AudioLevels) => void;
  onEnded: (reason: EndReason, error?: VoiceSessionError) => void;
}

interface VoiceSessionGrant {
  client_secret: string;
  session_id: string;
  max_seconds: number;
  remaining_messages: number;
}

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

// Only failures that can clear up on their own are worth a second try
const isRetryable = (error: unknown) =>
  error instanceof VoiceSessionError && (error.code === 'network' || error.code === 'server');

const requestGrant = async (mode: ChatMode): Promise<VoiceSessionGrant> => {
  const [keys, persona, headers, customs] = await Promise.all([
    fetchIdentityKeys(),
    getPreferredAiPersona(),
    getAuthHeaders(),
    fetchCustomPersonalities(),
  ]);
  const voice = pickPersonaVoice(persona, customs);

  let response: Response;
  try {
    response = await fetchWithTimeout(`${BASE_URL}/voice/session`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ mode, persona, voice, keys: organizeKeysByCategory(keys || []) }),
    }, GRANT_TIMEOUT_MS);
  } catch (e) {
    throw new VoiceSessionError('network', 'Could not reach the server. Check your connection and try again.');
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
    throw new VoiceSessionError('voice_limit_reached', 'You have used today\'s voice messages.');
  }
  if (response.status === 401) {
    throw new VoiceSessionError('auth', 'Your session expired. Close the app and sign in again.');
  }
  console.warn(`Voice session request failed: ${response.status} ${code ?? ''}`);
  throw new VoiceSessionError('server', 'Voice is unavailable right now. Please try again in a moment.');
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
  private connected = false;

  constructor(private mode: ChatMode, private callbacks: VoiceSessionCallbacks) {}

  async start(): Promise<{ maxSeconds: number; remainingMessages: number }> {
    this.setState('connecting');

    // Mic first: the permission prompt can take a while, and the server's key only lives about a minute
    try {
      this.stream = await mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (e) {
      const denied = new VoiceSessionError('mic_denied', 'Microphone access is needed for voice.');
      await this.end('error', denied);
      throw denied;
    }
    await this.guard();

    // Speaker, not earpiece; no proximity sensor since this isn't a phone call
    InCallManager.start({ media: 'audio', auto: false });
    InCallManager.setForceSpeakerphoneOn(true);

    // Loaded alongside the key request instead of after it, so the key isn't aging while we wait
    const historyPromise = fetchAIChatMessages(this.mode)
      .then(messages => messages.slice(-HISTORY_MESSAGES))
      .catch(() => []);

    let grant: VoiceSessionGrant | null = null;
    for (let attempt = 1; grant === null; attempt++) {
      try {
        const minted = await requestGrant(this.mode);
        this.sessionId = minted.session_id;
        await this.guard();
        await this.connect(minted.client_secret, await historyPromise);
        await this.guard();
        grant = minted;
      } catch (e) {
        if (e instanceof VoiceSessionError && e.code === 'aborted') throw e;
        const failure = e instanceof VoiceSessionError
          ? e
          : new VoiceSessionError('network', 'Could not start the voice connection.');
        console.warn(`Voice connect attempt ${attempt} failed:`, failure.code, failure.message);

        // Close the row of a failed attempt so it isn't left open
        this.discardConnection();
        await this.closeServerSession();
        if (this.ended) throw new VoiceSessionError('aborted', 'Voice session was closed.');

        if (attempt >= CONNECT_ATTEMPTS || !isRetryable(failure)) {
          await this.end('error', failure);
          throw failure;
        }
        await sleep(RETRY_DELAY_MS);
      }
    }

    this.timers.push(setTimeout(() => this.end('max_duration'), grant.max_seconds * 1000));
    this.intervals.push(setInterval(() => this.pollLevels(), LEVEL_POLL_MS));
    this.intervals.push(setInterval(() => this.watchdog(), 1000));

    this.callbacks.onRemainingMessages(grant.remaining_messages);
    return { maxSeconds: grant.max_seconds, remainingMessages: grant.remaining_messages };
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
    this.releaseMedia();

    this.setState('ended');
    this.callbacks.onLevels({ mic: 0, ai: 0 });
    this.callbacks.onEnded(reason, error);
    await this.closeServerSession();
  }

  // end() can run while start() is still awaiting; whatever start() acquires afterwards is released here
  private async guard() {
    if (!this.ended) return;
    this.releaseMedia();
    await this.closeServerSession();
    throw new VoiceSessionError('aborted', 'Voice session was closed.');
  }

  private discardConnection() {
    this.connected = false;
    try { this.channel?.close(); } catch (e) { /* already closed */ }
    try { this.pc?.close(); } catch (e) { /* already closed */ }
    this.channel = null;
    this.pc = null;
  }

  private releaseMedia() {
    this.discardConnection();
    this.stream?.getTracks().forEach((track: any) => track.stop());
    this.stream = null;
    try { InCallManager.stop(); } catch (e) { /* audio session already released */ }
  }

  private async connect(secret: string, history: { role: string; content: string }[]) {
    const pc = new RTCPeerConnection();
    this.pc = pc;

    this.stream.getAudioTracks().forEach((track: any) => pc.addTrack(track, this.stream));

    // The channel must exist before the offer is created, or it won't be negotiated
    const channel = pc.createDataChannel('oai-events');
    this.channel = channel;

    // Resolves once the data channel is open, which means the connection is really up
    let rejectOpen: (error: VoiceSessionError) => void = () => {};
    const opened = new Promise<void>((resolve, reject) => {
      rejectOpen = reject;
      channel.onopen = () => {
        this.connected = true;
        this.primeConversation(history);
        resolve();
      };
    });
    opened.catch(() => { /* surfaced where it is awaited; this keeps a late rejection from going unhandled */ });
    channel.onmessage = (message: any) => this.handleMessage(message.data);

    const lost = () => new VoiceSessionError('network', 'The voice connection was lost.');
    pc.onconnectionstatechange = () => {
      if (this.pc !== pc || this.ended) return;
      if (pc.connectionState === 'failed') {
        if (this.connected) this.end('network', lost());
        else rejectOpen(new VoiceSessionError('network', 'Could not establish the voice connection.'));
      } else if (pc.connectionState === 'disconnected' && this.connected) {
        // Brief drops often recover on their own
        this.timers.push(setTimeout(() => {
          if (this.pc === pc && pc.connectionState === 'disconnected') this.end('network', lost());
        }, DISCONNECT_GRACE_MS));
      }
    };

    const offer = await pc.createOffer({});
    await pc.setLocalDescription(offer);

    let answer: Response;
    try {
      answer = await fetchWithTimeout(REALTIME_CALLS_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/sdp' },
        body: offer.sdp,
      }, SDP_TIMEOUT_MS);
    } catch (e) {
      throw new VoiceSessionError('network', 'Could not reach the voice service.');
    }
    if (!answer.ok) {
      console.warn(`Realtime connect failed: ${answer.status}`, await answer.text().catch(() => ''));
      throw new VoiceSessionError('server', 'The voice service rejected the connection.');
    }

    await pc.setRemoteDescription({ type: 'answer', sdp: await answer.text() });

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new VoiceSessionError('network', 'The voice connection timed out.')),
        CHANNEL_OPEN_TIMEOUT_MS,
      );
    });
    try {
      await Promise.race([opened, timeout]);
    } finally {
      clearTimeout(timer);
    }
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
    out.turns.forEach(turn => {
      this.callbacks.onTurn(turn);
      if (turn.user) this.countMessage();
    });
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

  // The daily limit is counted in finished user turns. The AI has already answered this one, so
  // hitting zero can end the call without cutting a reply off.
  private async countMessage() {
    const sessionId = this.sessionId;
    if (!sessionId || this.ended) return;
    try {
      const response = await fetch(`${BASE_URL}/voice/session/message`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (response.status === 429) {
        this.callbacks.onRemainingMessages(0);
        this.end('limit');
        return;
      }
      if (!response.ok) {
        console.warn(`Voice message count failed: ${response.status}`);
        return;
      }
      const { remaining_messages: remaining } = await response.json();
      this.callbacks.onRemainingMessages(remaining);
      if (remaining <= 0) this.end('limit');
    } catch (e) {
      // A missed count favors the user; the per-session time guard still bounds the call
      console.warn('Voice message count failed:', e);
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
      // The row just stays open; nothing is billed by time, so there is nothing to recover
    }
  }
}
