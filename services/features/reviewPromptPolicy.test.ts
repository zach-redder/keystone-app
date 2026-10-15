import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isMilestoneWorthAsking,
  MAX_REQUESTS_PER_YEAR,
  MIN_DAYS_BETWEEN_REQUESTS,
  shouldRequestReview,
} from './reviewPromptPolicy';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 16);

test('a user who has never been asked can be asked', () => {
  assert.equal(shouldRequestReview([], NOW), true);
});

test('not again within the cooldown, then yes once it has passed', () => {
  assert.equal(shouldRequestReview([NOW - (MIN_DAYS_BETWEEN_REQUESTS - 1) * DAY], NOW), false);
  assert.equal(shouldRequestReview([NOW - MIN_DAYS_BETWEEN_REQUESTS * DAY], NOW), true);
});

test('stops at the yearly cap even when each request was spaced out', () => {
  const spaced = Array.from({ length: MAX_REQUESTS_PER_YEAR }, (_, index) => NOW - (100 + index * 100) * DAY);
  assert.equal(shouldRequestReview(spaced, NOW), false);
});

test('requests older than a year no longer count toward the cap', () => {
  const old = [NOW - 400 * DAY, NOW - 380 * DAY, NOW - 370 * DAY];
  assert.equal(shouldRequestReview(old, NOW), true);
});

test('only streaks of a week or more are worth interrupting', () => {
  assert.equal(isMilestoneWorthAsking(3), false);
  assert.equal(isMilestoneWorthAsking(7), true);
  assert.equal(isMilestoneWorthAsking(30), true);
});
