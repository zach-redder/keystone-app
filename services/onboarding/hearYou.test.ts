import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReflection } from './hearYou';
import { INTENTS } from './keySuggestions';

const keys = { values: ['Peace', 'Purpose', 'Wisdom'], goals: ['Own Business', 'Freedom'], vision: ['Father'] };

test('each intent gets its own calm, non-fearful opening', () => {
  const tensions = INTENTS.map((i) => buildReflection(i, keys).tension);
  assert.equal(new Set(tensions).size, INTENTS.length);
  for (const t of tensions) {
    assert.doesNotMatch(t, /fail|destroy|worthless|stuck forever/i);
  }
});

test('reflects at most two values and one goal back, in the user\'s own words', () => {
  const { keyLines } = buildReflection('self_doubt', keys);
  const joined = keyLines.join(' ');
  assert.match(joined, /Peace/);
  assert.match(joined, /Purpose/);
  assert.doesNotMatch(joined, /Wisdom/);
  assert.match(joined, /Own Business/);
  assert.doesNotMatch(joined, /Freedom/);
});

test('with no keys there are no key lines and nothing says undefined', () => {
  const r = buildReflection('direction', { values: [], goals: [], vision: [] });
  assert.deepEqual(r.keyLines, []);
  assert.doesNotMatch(JSON.stringify(r), /undefined|null/);
});

test('missing or unknown intent still returns usable copy', () => {
  for (const intent of [undefined, 'nonsense' as never]) {
    const r = buildReflection(intent, keys);
    assert.ok(r.tension.length > 20 && r.hope.length > 20);
  }
});

test('hope text is the same for everyone and names what Keystone does', () => {
  const hopes = new Set(INTENTS.map((i) => buildReflection(i, keys).hope));
  assert.equal(hopes.size, 1);
  assert.match([...hopes][0], /Keystone/);
});
