// Storage for the Supabase session that keeps tokens in the iOS Keychain instead of plain app storage.
// The Keychain-backed store limits each value to about 2 KB and a session is larger, so values are
// split into chunks. The backends are injected so this logic can be unit-tested off-device.

export interface SecureBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface LegacyBackend {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// Characters, not bytes: the session is almost all ASCII, and this leaves headroom for a multi-byte name
const CHUNK_SIZE = 1000;
const CHUNK_COUNT_SUFFIX = '.chunks';
// Lives in the app's own storage, which is deleted on uninstall (the Keychain is not)
const MIGRATED_FLAG_PREFIX = 'secure_storage_migrated.';

const chunkKey = (key: string, index: number) => `${key}.${index}`;

export const createChunkedStorage = (secure: SecureBackend, legacy: LegacyBackend) => {
  const readSecure = async (key: string): Promise<string | null> => {
    const count = Number(await secure.get(`${key}${CHUNK_COUNT_SUFFIX}`));
    if (!Number.isInteger(count) || count < 1) return null;

    const parts: string[] = [];
    for (let index = 0; index < count; index += 1) {
      const part = await secure.get(chunkKey(key, index));
      // A missing chunk means a write was interrupted; treat it as signed out rather than hand back half a session
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join('');
  };

  const removeSecure = async (key: string): Promise<void> => {
    const count = Number(await secure.get(`${key}${CHUNK_COUNT_SUFFIX}`));
    if (Number.isInteger(count)) {
      for (let index = 0; index < count; index += 1) {
        await secure.remove(chunkKey(key, index));
      }
    }
    await secure.remove(`${key}${CHUNK_COUNT_SUFFIX}`);
  };

  const writeSecure = async (key: string, value: string): Promise<void> => {
    const previousCount = Number(await secure.get(`${key}${CHUNK_COUNT_SUFFIX}`));
    const chunks: string[] = [];
    for (let start = 0; start < value.length; start += CHUNK_SIZE) {
      chunks.push(value.slice(start, start + CHUNK_SIZE));
    }
    if (chunks.length === 0) chunks.push('');

    for (let index = 0; index < chunks.length; index += 1) {
      await secure.set(chunkKey(key, index), chunks[index]);
    }
    // The count is written last, so a reader never sees a count that points at chunks not yet written
    await secure.set(`${key}${CHUNK_COUNT_SUFFIX}`, String(chunks.length));

    if (Number.isInteger(previousCount)) {
      for (let index = chunks.length; index < previousCount; index += 1) {
        await secure.remove(chunkKey(key, index));
      }
    }
  };

  const getItem = async (key: string): Promise<string | null> => {
    const flagKey = `${MIGRATED_FLAG_PREFIX}${key}`;
    if (await legacy.getItem(flagKey)) {
      return readSecure(key);
    }

    const legacyValue = await legacy.getItem(key);
    if (legacyValue !== null) {
      // First launch after the update: move the existing session so nobody is signed out
      await writeSecure(key, legacyValue);
      await legacy.removeItem(key);
      await legacy.setItem(flagKey, '1');
      return legacyValue;
    }

    // Nothing in the old store. Whatever the Keychain holds survived an uninstall (iOS keeps Keychain
    // items across reinstalls), and must not sign the new install in as the previous user.
    await removeSecure(key);
    await legacy.setItem(flagKey, '1');
    return null;
  };

  const setItem = async (key: string, value: string): Promise<void> => {
    await writeSecure(key, value);
    await legacy.setItem(`${MIGRATED_FLAG_PREFIX}${key}`, '1');
    await legacy.removeItem(key);
  };

  const removeItem = async (key: string): Promise<void> => {
    await removeSecure(key);
    await legacy.removeItem(key);
  };

  return { getItem, setItem, removeItem };
};
