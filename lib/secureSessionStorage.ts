import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createChunkedStorage } from './chunkedStorage';

// Readable once the device has been unlocked after boot, so the token can still refresh when the app
// wakes in the background (for example to reschedule reminders)
const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

export const secureSessionStorage = createChunkedStorage(
  {
    get: (key) => SecureStore.getItemAsync(key, options),
    set: (key, value) => SecureStore.setItemAsync(key, value, options),
    remove: (key) => SecureStore.deleteItemAsync(key, options),
  },
  AsyncStorage
);
