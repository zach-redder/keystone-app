import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const FIVE_MINUTES_MS = 5 * 60 * 1000;

// Cached data paints instantly on launch and is revalidated in the background once it's stale.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: FIVE_MINUTES_MS,
      gcTime: ONE_DAY_MS,
      retry: 1,
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'keystone_query_cache',
  throttleTime: 1000,
});

// Bump to throw away every device's persisted cache after a change to a cached data shape
export const QUERY_CACHE_VERSION = '1';
export const QUERY_CACHE_MAX_AGE_MS = ONE_DAY_MS;

export const queryKeys = {
  userStats: ['userStats'] as const,
  identityKeys: ['identityKeys'] as const,
  proStatus: ['proStatus'] as const,
};
