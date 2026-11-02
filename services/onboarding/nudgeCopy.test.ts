import test from 'node:test';
import assert from 'node:assert/strict';
import { nudgeLine } from './nudgeCopy';

test('each nudge preference gets its own sentence', () => {
  const lines = ['morning', 'moment', 'evening'].map(nudgeLine);
  assert.equal(new Set(lines).size, 3);
  assert.match(nudgeLine('morning'), /morning/i);
  assert.match(nudgeLine('evening'), /evening/i);
});

test('missing or unknown preference gets the generic sentence', () => {
  const generic = nudgeLine(undefined);
  assert.ok(generic.length > 20);
  assert.equal(nudgeLine(null), generic);
  assert.equal(nudgeLine('whenever'), generic);
});
