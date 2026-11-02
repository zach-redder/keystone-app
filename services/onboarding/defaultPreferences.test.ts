import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDefaultPreferences, DEFAULT_REMINDER_TIME } from './defaultPreferences';

test('the nudge answer sets the reminder time', () => {
  assert.equal(buildDefaultPreferences('morning', 'UTC').preferred_reminder_time, '08:00:00');
  assert.equal(buildDefaultPreferences('evening', 'UTC').preferred_reminder_time, '19:00:00');
  assert.equal(buildDefaultPreferences('moment', 'UTC').preferred_reminder_time, DEFAULT_REMINDER_TIME);
});

test('missing or unknown nudge falls back to the default time', () => {
  for (const nudge of [undefined, null, '', 'noon' as string]) {
    assert.equal(buildDefaultPreferences(nudge, 'UTC').preferred_reminder_time, DEFAULT_REMINDER_TIME);
  }
});

test('keeps the existing defaults for everything else', () => {
  assert.deepEqual(buildDefaultPreferences(undefined, 'America/Chicago'), {
    timezone: 'America/Chicago',
    notification_opt_in: true,
    preferred_reminder_time: DEFAULT_REMINDER_TIME,
    preferred_ai_persona: 'Gentle Guide',
  });
});
