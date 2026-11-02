import test from 'node:test';
import assert from 'node:assert/strict';
import { INTENTS, suggestKeys, KeyStep } from './keySuggestions';
import { KEY_OPTIONS } from '../../constants/onboardingKeyOptions';

const STEPS: KeyStep[] = ['core_values', 'life_goals', 'future_self_vision'];

test('every suggested chip exists in that step\'s real option list', () => {
  for (const intent of INTENTS) {
    for (const step of STEPS) {
      const all = Object.values(KEY_OPTIONS[step]).flat();
      for (const chip of suggestKeys(intent, step)) {
        assert.ok(all.includes(chip), `${intent}/${step}: "${chip}" is not a real chip`);
      }
    }
  }
});

test('suggests at most 3 chips per step, with no duplicates', () => {
  for (const intent of INTENTS) {
    for (const step of STEPS) {
      const chips = suggestKeys(intent, step);
      assert.ok(chips.length <= 3);
      assert.equal(new Set(chips).size, chips.length);
    }
  }
});

test('different intents produce different value suggestions', () => {
  const sets = INTENTS.map((i) => suggestKeys(i, 'core_values').join('|'));
  assert.equal(new Set(sets).size, INTENTS.length);
});

test('unknown or missing intent suggests nothing rather than guessing', () => {
  assert.deepEqual(suggestKeys(undefined, 'core_values'), []);
  assert.deepEqual(suggestKeys('nonsense' as never, 'life_goals'), []);
});
