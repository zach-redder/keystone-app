import test from 'node:test';
import assert from 'node:assert/strict';
import { decideAccess } from './accessGate';

const CUTOFF = '2026-12-01T00:00:00Z';
const on = { enabled: true, grandfatherBefore: CUTOFF };

test('gate disabled: everyone is allowed in, Pro or not', () => {
  const off = { enabled: false, grandfatherBefore: CUTOFF };
  assert.equal(decideAccess({ isPro: false, accountCreatedAt: '2027-01-01T00:00:00Z' }, off), 'allow');
});

test('Pro users are always allowed', () => {
  assert.equal(decideAccess({ isPro: true, accountCreatedAt: '2027-01-01T00:00:00Z' }, on), 'allow');
});

test('free accounts created before the cutoff are grandfathered', () => {
  assert.equal(decideAccess({ isPro: false, accountCreatedAt: '2026-11-15T12:00:00Z' }, on), 'allow');
});

test('free accounts created at or after the cutoff hit the paywall', () => {
  assert.equal(decideAccess({ isPro: false, accountCreatedAt: CUTOFF }, on), 'paywall');
  assert.equal(decideAccess({ isPro: false, accountCreatedAt: '2026-12-02T00:00:00Z' }, on), 'paywall');
});

test('unknown or unparseable creation date fails open rather than locking someone out', () => {
  for (const accountCreatedAt of [undefined, null, '', 'not-a-date']) {
    assert.equal(decideAccess({ isPro: false, accountCreatedAt }, on), 'allow', String(accountCreatedAt));
  }
});

test('enabled with no cutoff configured: every non-Pro account is paywalled', () => {
  const noCutoff = { enabled: true, grandfatherBefore: null };
  assert.equal(decideAccess({ isPro: false, accountCreatedAt: '2020-01-01T00:00:00Z' }, noCutoff), 'paywall');
  assert.equal(decideAccess({ isPro: true, accountCreatedAt: '2020-01-01T00:00:00Z' }, noCutoff), 'allow');
});
