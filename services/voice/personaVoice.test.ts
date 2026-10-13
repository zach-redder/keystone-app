import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PERSONA_VOICES, DEFAULT_VOICE, VOICES, pickPersonaVoice } from './personaVoice';

const voiceIds: string[] = VOICES.map(voice => voice.id);

test('every default persona maps to a listed voice, and each gets its own', () => {
  const assigned = Object.values(DEFAULT_PERSONA_VOICES);
  assert.equal(assigned.length, 5);
  assigned.forEach(voice => assert.ok(voiceIds.includes(voice), `${voice} is not in VOICES`));
  assert.equal(new Set(assigned).size, assigned.length);
});

test('the fallback voice is a listed voice', () => {
  assert.ok(voiceIds.includes(DEFAULT_VOICE));
});

test('a default persona resolves from the stored "Name: Description" string', () => {
  assert.equal(
    pickPersonaVoice('Mindful Monk: Calm and centered.', []),
    DEFAULT_PERSONA_VOICES['Mindful Monk'],
  );
});

test('a custom persona resolves to its chosen voice', () => {
  const customs = [{ name: 'Wise Sage', description: 'x', icon: 'x', voice: 'ballad' }];
  assert.equal(pickPersonaVoice('Wise Sage: Speaks slowly.', customs), 'ballad');
});

test('a custom persona with the same name as a default wins', () => {
  const customs = [{ name: 'Life Coach', description: 'x', icon: 'x', voice: 'echo' }];
  assert.equal(pickPersonaVoice('Life Coach: custom take', customs), 'echo');
});

test('a custom persona without a voice, or an unknown voice, falls back to the default voice', () => {
  const customs = [
    { name: 'Plain', description: 'x', icon: 'x', voice: null },
    { name: 'Odd', description: 'x', icon: 'x', voice: 'not-a-voice' },
  ];
  assert.equal(pickPersonaVoice('Plain: x', customs), DEFAULT_VOICE);
  assert.equal(pickPersonaVoice('Odd: x', customs), DEFAULT_VOICE);
});

test('an unknown or bare persona falls back to the default voice', () => {
  assert.equal(pickPersonaVoice('Default', []), DEFAULT_VOICE);
  assert.equal(pickPersonaVoice('Someone Else: whatever', []), DEFAULT_VOICE);
});
