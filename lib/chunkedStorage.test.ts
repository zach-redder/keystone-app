import test from 'node:test';
import assert from 'node:assert/strict';
import { createChunkedStorage, LegacyBackend, SecureBackend } from './chunkedStorage';

const memory = () => {
  const data = new Map<string, string>();
  return {
    data,
    secure: {
      get: async (key) => data.get(key) ?? null,
      set: async (key, value) => void data.set(key, value),
      remove: async (key) => void data.delete(key),
    } as SecureBackend,
    legacy: {
      getItem: async (key) => data.get(key) ?? null,
      setItem: async (key, value) => void data.set(key, value),
      removeItem: async (key) => void data.delete(key),
    } as LegacyBackend,
  };
};

const setup = () => {
  const keychain = memory();
  const appStorage = memory();
  return { keychain, appStorage, storage: createChunkedStorage(keychain.secure, appStorage.legacy) };
};

const KEY = 'sb-supabase-auth-token';
const bigSession = JSON.stringify({ access_token: 'a'.repeat(2600), refresh_token: 'r'.repeat(40), user: { name: 'Zoë' } });

test('a session larger than one keychain value round-trips', async () => {
  const { storage, keychain } = setup();
  await storage.setItem(KEY, bigSession);

  assert.equal(await storage.getItem(KEY), bigSession);
  assert.ok(Number(keychain.data.get(`${KEY}.chunks`)) > 1);
  assert.ok([...keychain.data.values()].every((value) => value.length <= 1000));
});

test('shrinking a value removes the stale chunks', async () => {
  const { storage, keychain } = setup();
  await storage.setItem(KEY, bigSession);
  await storage.setItem(KEY, 'short');

  assert.equal(await storage.getItem(KEY), 'short');
  assert.deepEqual([...keychain.data.keys()].sort(), [`${KEY}.0`, `${KEY}.chunks`]);
});

test('an existing session in plain storage is moved to the keychain, not lost', async () => {
  const { storage, keychain, appStorage } = setup();
  appStorage.data.set(KEY, bigSession);

  assert.equal(await storage.getItem(KEY), bigSession);
  assert.equal(appStorage.data.has(KEY), false);
  assert.ok(keychain.data.has(`${KEY}.chunks`));
  // And it keeps working on the next launch
  assert.equal(await storage.getItem(KEY), bigSession);
});

test('a keychain session left over from a previous install is wiped, not reused', async () => {
  const { storage, keychain } = setup();
  await storage.setItem(KEY, bigSession);
  // A reinstall deletes app storage (including the migrated flag) but not the keychain
  const reinstalled = createChunkedStorage(keychain.secure, memory().legacy);

  assert.equal(await reinstalled.getItem(KEY), null);
  assert.equal(keychain.data.size, 0);
});

test('removing the item clears both stores', async () => {
  const { storage, keychain, appStorage } = setup();
  await storage.setItem(KEY, bigSession);
  appStorage.data.set(KEY, 'stale');
  await storage.removeItem(KEY);

  assert.equal(await storage.getItem(KEY), null);
  assert.equal(keychain.data.size, 0);
  assert.equal(appStorage.data.has(KEY), false);
});

test('a half-written session reads as signed out', async () => {
  const { storage, keychain } = setup();
  await storage.setItem(KEY, bigSession);
  keychain.data.delete(`${KEY}.1`);

  assert.equal(await storage.getItem(KEY), null);
});

test('keys are independent', async () => {
  const { storage } = setup();
  await storage.setItem(KEY, 'session');
  await storage.setItem(`${KEY}-code-verifier`, 'verifier');
  await storage.removeItem(`${KEY}-code-verifier`);

  assert.equal(await storage.getItem(KEY), 'session');
  assert.equal(await storage.getItem(`${KEY}-code-verifier`), null);
});

test('an empty string is stored and read back as empty, not null', async () => {
  const { storage } = setup();
  await storage.setItem(KEY, '');
  assert.equal(await storage.getItem(KEY), '');
});
