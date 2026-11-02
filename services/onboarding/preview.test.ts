import test from 'node:test';
import assert from 'node:assert/strict';
import { DOUBTS, buildPreview } from './preview';

const keys = { values: ['Peace', 'Purpose'], goals: ['Own Business'], vision: ['Father'] };

test('both replies are written from the user\'s own keys', () => {
  for (const doubt of DOUBTS) {
    const { affirm, question } = buildPreview(doubt.id, keys);
    assert.match(affirm, /Peace/);
    assert.match(question, /Own Business|Peace|Purpose/);
  }
});

test('each doubt gets distinct replies', () => {
  const affirms = DOUBTS.map((d) => buildPreview(d.id, keys).affirm);
  assert.equal(new Set(affirms).size, DOUBTS.length);
});

test('the question reply actually ends in a question', () => {
  for (const doubt of DOUBTS) {
    assert.match(buildPreview(doubt.id, keys).question, /\?$/);
  }
});

test('with no keys it still returns usable generic copy, never "undefined"', () => {
  for (const doubt of DOUBTS) {
    const { affirm, question } = buildPreview(doubt.id, { values: [], goals: [], vision: [] });
    assert.ok(affirm.length > 20 && question.length > 20);
    assert.doesNotMatch(affirm + question, /undefined|null|\[object/);
  }
});

test('an unknown doubt id falls back to the first doubt instead of throwing', () => {
  const fallback = buildPreview('nope' as never, keys);
  assert.deepEqual(fallback, buildPreview(DOUBTS[0].id, keys));
});
