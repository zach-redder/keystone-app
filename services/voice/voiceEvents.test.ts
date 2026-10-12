import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VoiceEventTracker, Turn, VoiceState } from './voiceEvents';

const run = (events: any[]) => {
  const tracker = new VoiceEventTracker();
  const turns: Turn[] = [];
  const states: VoiceState[] = [];
  let caption: string | null = null;
  let error: string | undefined;
  for (const event of events) {
    const out = tracker.handle(event);
    turns.push(...out.turns);
    if (out.state) states.push(out.state);
    if (out.caption !== undefined) caption = out.caption;
    if (out.error) error = out.error;
  }
  return { turns, states, caption, error, tracker };
};

const userSays = (text: string) => [
  { type: 'input_audio_buffer.speech_started' },
  { type: 'input_audio_buffer.speech_stopped' },
  { type: 'conversation.item.input_audio_transcription.completed', transcript: text },
];

const aiSays = (text: string) => [
  { type: 'response.created' },
  { type: 'output_audio_buffer.started' },
  { type: 'response.output_audio_transcript.delta', delta: text.slice(0, 3) },
  { type: 'response.output_audio_transcript.delta', delta: text.slice(3) },
  { type: 'response.output_audio_transcript.done', transcript: text },
  { type: 'response.done', response: { status: 'completed' } },
  { type: 'output_audio_buffer.stopped' },
];

test('one exchange produces one ordered turn and ends listening', () => {
  const { turns, states } = run([...userSays('I doubt myself'), ...aiSays('Tell me more.')]);
  assert.deepEqual(turns, [{ user: 'I doubt myself', assistant: 'Tell me more.' }]);
  assert.equal(states[0], 'userSpeaking');
  assert.equal(states.at(-1), 'listening');
});

test('state walks userSpeaking, thinking, speaking, listening', () => {
  const { states } = run([...userSays('hi'), ...aiSays('hello there')]);
  const compact = states.filter((s, i) => s !== states[i - 1]);
  assert.deepEqual(compact, ['userSpeaking', 'thinking', 'speaking', 'listening']);
});

test('stays speaking after response.done until the audio buffer stops playing', () => {
  const tracker = new VoiceEventTracker();
  [...userSays('hi'), { type: 'response.created' }, { type: 'output_audio_buffer.started' }].forEach(e => tracker.handle(e));
  const afterDone = tracker.handle({ type: 'response.done', response: { status: 'completed' } });
  assert.notEqual(afterDone.state, 'listening');
  assert.equal(tracker.handle({ type: 'output_audio_buffer.stopped' }).state, 'listening');
});

test('assistant finishing before the user transcript arrives still pairs in order', () => {
  const { turns } = run([
    { type: 'input_audio_buffer.speech_started' },
    { type: 'input_audio_buffer.speech_stopped' },
    ...aiSays('Go on.'),
    { type: 'conversation.item.input_audio_transcription.completed', transcript: 'late transcript' },
  ]);
  assert.deepEqual(turns, [{ user: 'late transcript', assistant: 'Go on.' }]);
});

test('two exchanges stay paired in order', () => {
  const { turns } = run([...userSays('one'), ...aiSays('first'), ...userSays('two'), ...aiSays('second')]);
  assert.deepEqual(turns, [
    { user: 'one', assistant: 'first' },
    { user: 'two', assistant: 'second' },
  ]);
});

test('an interrupted reply keeps the partial text it had spoken', () => {
  const { turns } = run([
    ...userSays('first question'),
    { type: 'response.created' },
    { type: 'output_audio_buffer.started' },
    { type: 'response.output_audio_transcript.delta', delta: 'Well, I think' },
    { type: 'input_audio_buffer.speech_started' },
    { type: 'output_audio_buffer.cleared' },
    { type: 'response.done', response: { status: 'cancelled' } },
    { type: 'input_audio_buffer.speech_stopped' },
    { type: 'conversation.item.input_audio_transcription.completed', transcript: 'actually wait' },
    ...aiSays('Sure.'),
  ]);
  assert.deepEqual(turns, [
    { user: 'first question', assistant: 'Well, I think' },
    { user: 'actually wait', assistant: 'Sure.' },
  ]);
});

test('a blank transcription still keeps the turns aligned', () => {
  const { turns } = run([...userSays('   '), ...aiSays('Hmm?'), ...userSays('real'), ...aiSays('Right.')]);
  assert.deepEqual(turns, [
    { user: '', assistant: 'Hmm?' },
    { user: 'real', assistant: 'Right.' },
  ]);
});

test('a cancelled reply with no text still pairs, with an empty assistant', () => {
  const { turns } = run([
    ...userSays('hello'),
    { type: 'response.created' },
    { type: 'response.done', response: { status: 'cancelled' } },
  ]);
  assert.deepEqual(turns, [{ user: 'hello', assistant: '' }]);
});

test('captions follow the AI transcript and then the user transcript', () => {
  assert.equal(
    run([
      { type: 'response.created' },
      { type: 'response.output_audio_transcript.delta', delta: 'Hel' },
      { type: 'response.output_audio_transcript.delta', delta: 'lo' },
    ]).caption,
    'Hello',
  );
  assert.equal(run(userSays('my words')).caption, 'my words');
});

test('older event names are understood too', () => {
  const { turns } = run([
    ...userSays('hi'),
    { type: 'response.created' },
    { type: 'response.audio_transcript.delta', delta: 'yo' },
    { type: 'response.audio_transcript.done', transcript: 'yo' },
    { type: 'response.done', response: { status: 'completed' } },
  ]);
  assert.deepEqual(turns, [{ user: 'hi', assistant: 'yo' }]);
});

test('error events surface a message and unknown events are ignored', () => {
  const { error } = run([{ type: 'error', error: { message: 'boom' } }]);
  assert.equal(error, 'boom');
  const out = new VoiceEventTracker().handle({ type: 'rate_limits.updated' });
  assert.deepEqual(out, { turns: [] });
});
