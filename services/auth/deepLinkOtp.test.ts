import test from 'node:test';
import assert from 'node:assert/strict';
import { isOtpTypeAllowedForPath } from './deepLinkOtp';

test('each path accepts only the types the landing page routes to it', () => {
  assert.equal(isOtpTypeAllowedForPath('emailconfirmation', 'signup'), true);
  assert.equal(isOtpTypeAllowedForPath('signin', 'email_change'), true);
  assert.equal(isOtpTypeAllowedForPath('resetpassword', 'recovery'), true);
});

test('a crafted type for the wrong path is refused', () => {
  assert.equal(isOtpTypeAllowedForPath('emailconfirmation', 'recovery'), false);
  assert.equal(isOtpTypeAllowedForPath('resetpassword', 'signup'), false);
  assert.equal(isOtpTypeAllowedForPath('signin', 'recovery'), false);
});

test('types that no link should carry are refused everywhere', () => {
  for (const path of ['emailconfirmation', 'signin', 'resetpassword']) {
    assert.equal(isOtpTypeAllowedForPath(path, 'invite'), false);
    assert.equal(isOtpTypeAllowedForPath(path, 'magiclink'), false);
    assert.equal(isOtpTypeAllowedForPath(path, ''), false);
  }
});

test('an unknown path accepts nothing', () => {
  assert.equal(isOtpTypeAllowedForPath('home', 'signup'), false);
  assert.equal(isOtpTypeAllowedForPath('__proto__', 'signup'), false);
});
