export type VoiceState = 'connecting' | 'listening' | 'userSpeaking' | 'thinking' | 'speaking' | 'ended' | 'error';

export interface Turn {
  user: string;
  assistant: string;
}

export interface TrackerOutput {
  state?: VoiceState;
  caption?: string | null;
  turns: Turn[];
  error?: string;
}

// Event names have moved between Realtime API versions, so both spellings are accepted.
const ASSISTANT_DELTA = ['response.output_audio_transcript.delta', 'response.audio_transcript.delta'];
const ASSISTANT_DONE = ['response.output_audio_transcript.done', 'response.audio_transcript.done'];
const AUDIO_DELTA = ['response.output_audio.delta', 'response.audio.delta'];

/**
 * Turns the Realtime data-channel event stream into a UI state, a live caption and finished
 * user/assistant turns. Pure on purpose: the WebRTC wiring is hard to test, this isn't.
 *
 * Turns are paired first-in-first-out because transcription of the user's speech is
 * asynchronous and can finish after the assistant has already replied.
 */
export class VoiceEventTracker {
  private userSpeaking = false;
  private awaitingResponse = false;
  private responseActive = false;
  private audioPlaying = false;
  private sawBufferEvents = false;
  private assistantText = '';
  private finalAssistantText: string | null = null;
  private lastState: VoiceState = 'listening';
  private users: string[] = [];
  private assistants: string[] = [];

  handle(event: any): TrackerOutput {
    const out: TrackerOutput = { turns: [] };
    const type: string = event?.type ?? '';

    if (type === 'error') {
      out.state = 'error';
      out.error = event?.error?.message ?? 'Voice connection error';
      this.lastState = 'error';
      return out;
    }

    if (type === 'input_audio_buffer.speech_started') {
      this.userSpeaking = true;
      this.awaitingResponse = false;
      out.caption = '';
    } else if (type === 'input_audio_buffer.speech_stopped') {
      this.userSpeaking = false;
      this.awaitingResponse = true;
    } else if (type === 'conversation.item.input_audio_transcription.completed') {
      const transcript = String(event.transcript ?? '').trim();
      this.users.push(transcript);
      if (transcript) out.caption = transcript;
    } else if (type === 'response.created') {
      this.awaitingResponse = false;
      this.responseActive = true;
      this.assistantText = '';
      this.finalAssistantText = null;
    } else if (ASSISTANT_DELTA.includes(type)) {
      this.assistantText += String(event.delta ?? '');
      if (!this.sawBufferEvents) this.audioPlaying = true;
      out.caption = this.assistantText;
    } else if (AUDIO_DELTA.includes(type)) {
      if (!this.sawBufferEvents) this.audioPlaying = true;
    } else if (ASSISTANT_DONE.includes(type)) {
      this.finalAssistantText = String(event.transcript ?? '');
    } else if (type === 'output_audio_buffer.started') {
      this.sawBufferEvents = true;
      this.audioPlaying = true;
    } else if (type === 'output_audio_buffer.stopped' || type === 'output_audio_buffer.cleared') {
      this.sawBufferEvents = true;
      this.audioPlaying = false;
    } else if (type === 'response.done') {
      // Finalizing here covers interrupted replies too, which may never get a transcript.done
      this.assistants.push((this.finalAssistantText ?? this.assistantText).trim());
      this.assistantText = '';
      this.finalAssistantText = null;
      this.responseActive = false;
      if (!this.sawBufferEvents) this.audioPlaying = false;
    } else {
      return out;
    }

    while (this.users.length > 0 && this.assistants.length > 0) {
      out.turns.push({ user: this.users.shift() as string, assistant: this.assistants.shift() as string });
    }

    const next = this.deriveState();
    if (next !== this.lastState) {
      this.lastState = next;
      out.state = next;
    }
    return out;
  }

  /** Clears "thinking" if the server never answered (e.g. a noise blip). Returns the new state, if it changed. */
  settle(): VoiceState | undefined {
    this.awaitingResponse = false;
    const next = this.deriveState();
    if (next === this.lastState) return undefined;
    this.lastState = next;
    return next;
  }

  private deriveState(): VoiceState {
    if (this.userSpeaking) return 'userSpeaking';
    if (this.audioPlaying) return 'speaking';
    if (this.awaitingResponse || this.responseActive) return 'thinking';
    return 'listening';
  }
}
