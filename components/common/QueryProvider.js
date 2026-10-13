import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { focusManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { supabase } from '../../lib/supabase';
import {
  queryClient,
  queryPersister,
  QUERY_CACHE_VERSION,
  QUERY_CACHE_MAX_AGE_MS,
} from '../../lib/queryClient';

const persistOptions = {
  persister: queryPersister,
  maxAge: QUERY_CACHE_MAX_AGE_MS,
  buster: QUERY_CACHE_VERSION,
};

// Cached data belongs to one account; never let it show up for another one.
function CacheGuard() {
  const lastUserId = useRef(undefined);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id ?? null;
      if (lastUserId.current !== undefined && lastUserId.current !== userId) {
        queryClient.clear();
        queryPersister.removeClient();
      }
      lastUserId.current = userId;
    });
    return () => subscription.unsubscribe();
  }, []);

  // React Native has no window focus; treat "app became active" as focus so stale data refreshes
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
    });
    return () => sub.remove();
  }, []);

  return null;
}

export default function QueryProvider({ children }) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <CacheGuard />
      {children}
    </PersistQueryClientProvider>
  );
}
