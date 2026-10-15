import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { secureSessionStorage } from './secureSessionStorage';
import { SupabaseClientOptions } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const options: SupabaseClientOptions<'public'> = {
  auth: {
    // Tokens live in the Keychain; existing sessions are migrated on first read (see chunkedStorage.ts)
    storage: secureSessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    storageKey: 'sb-supabase-auth-token',
  },
};

if (!Constants.expoConfig?.extra?.supabaseUrl || !Constants.expoConfig?.extra?.supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your app.config.js');
}

export const supabase = createClient(
  Constants.expoConfig.extra.supabaseUrl,
  Constants.expoConfig.extra.supabaseAnonKey,
  options
);