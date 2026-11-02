import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePreAuthResume, resolvePostSignupResume } from './resume';

test('pre-auth: returns only known pre-account onboarding routes', () => {
  for (const route of [
    '/onboarding/Quiz/1',
    '/onboarding/Quiz/4',
    '/onboarding/CoreValues',
    '/onboarding/LifeGoals',
    '/onboarding/FutureSelfVision',
    '/onboarding/HearYou',
    '/onboarding/Preview',
    '/register',
  ]) {
    assert.equal(resolvePreAuthResume(route), route);
  }
});

test('pre-auth: rejects missing, unknown, out-of-range and post-account routes', () => {
  for (const bad of [
    null,
    undefined,
    '',
    '/onboarding/Quiz/5',
    '/onboarding/Quiz/UserInfo',
    '/onboarding/FreeTrial',
    '/onboarding/NotificationPermission',
    '/tabs/home',
  ]) {
    assert.equal(resolvePreAuthResume(bad as never), null, String(bad));
  }
});

test('post-signup: returns only the screens that run after the account exists', () => {
  for (const route of [
    '/onboarding/NotificationPermission',
    '/onboarding/AppRating',
    '/onboarding/KeysReady',
    '/onboarding/FreeTrial',
  ]) {
    assert.equal(resolvePostSignupResume(route), route);
  }
});

test('post-signup: rejects pre-account routes and anything that is not an exact match', () => {
  for (const bad of [
    null,
    '/onboarding/Preview',
    '/register',
    '/tabs/home',
    '//evil.example.com',
    'https://evil.example.com',
    '/onboarding/FreeTrial?next=/x',
    '/onboarding/FreeTrial/',
  ]) {
    assert.equal(resolvePostSignupResume(bad as never), null, String(bad));
  }
});
