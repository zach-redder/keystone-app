import '../utils/silenceProductionLogs';
import React, { useEffect, useRef } from 'react';
import { Slot, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { handleReferralDeepLink } from '../services/integrations/deepLinkService';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupReminderNotifications } from '../services/features/reminderService';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SuperwallContextProvider } from '../contexts/SuperwallContext';
import { getSuperwallImplementation } from '../utils/superwallCompat';
import SplashScreen from './SplashScreen';
import QueryProvider from '../components/common/QueryProvider';

// Get Superwall components (mock in Expo Go, real in production)
const { SuperwallProvider, SuperwallLoading, SuperwallLoaded } = getSuperwallImplementation();

function RootShell() {
  const router = useRouter();
  const midnightTimeoutRef = useRef(null);
  const appState = useRef('active');

  useEffect(() => {
    // Earlier builds kept the sign-up password here while waiting for email confirmation; it is
    // now held in memory only, so clear any copy an older install left behind.
    AsyncStorage.removeItem('tempPassword').catch(() => {});
  }, []);

  useEffect(() => {
    appState.current = AppState.currentState;

    // Initial schedule of reminder notifications on app start
    setupReminderNotifications().catch(console.error);

    // Re-schedule when app returns to foreground
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        setupReminderNotifications().catch(console.error);
      }
      appState.current = nextState;
    });

    // Schedule a refresh shortly after local midnight to pick up the new daily reminder
    const scheduleMidnightRefresh = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setDate(now.getDate() + 1);
      nextMidnight.setHours(0, 1, 0, 0); // 00:01 local time
      const delay = Math.max(1000, nextMidnight.getTime() - now.getTime());
      midnightTimeoutRef.current = setTimeout(async () => {
        try {
          await setupReminderNotifications();
        } catch (e) {
          console.error('Midnight reminder reschedule failed:', e);
        } finally {
          scheduleMidnightRefresh();
        }
      }, delay);
    };

    scheduleMidnightRefresh();

    return () => {
      sub.remove();
      if (midnightTimeoutRef.current) clearTimeout(midnightTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    // keystone://<path>?<query>#<hash> -- split without relying on URL/Linking.parse's
    // ambiguous hostname-vs-path handling for custom schemes.
    const parseDeepLink = (url) => {
      const withoutScheme = url.replace(/^keystone:\/\//, '');
      const [pathAndQuery, hashPart] = withoutScheme.split('#');
      const [path, queryString] = pathAndQuery.split('?');
      return {
        path,
        queryParams: new URLSearchParams(queryString || ''),
        hashParams: new URLSearchParams(hashPart || ''),
      };
    };

    // Supabase can hand us a session in three different shapes depending on the auth
    // flow: a token_hash+type pair (verifyOtp, works from any client), a full
    // access_token/refresh_token pair (implicit flow, in the hash), or a PKCE code
    // (exchangeCodeForSession -- only works if this client's storage holds the
    // matching verifier, i.e. this same app instance initiated the request).
    // Which token_hash `type` each path may carry, matching how keystone-landingpage's /verify routes
    // them. The type comes from a link anyone can craft, so it is never passed to verifyOtp unchecked.
    const OTP_TYPES_BY_PATH = {
      emailconfirmation: ['signup', 'email'],
      signin: ['email_change', 'email'],
      resetpassword: ['recovery'],
    };

    const establishSessionFromDeepLink = async (path, queryParams, hashParams, url) => {
      const type = queryParams.get('type') || hashParams.get('type');
      const tokenHash = queryParams.get('token_hash');
      const code = queryParams.get('code');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (tokenHash && type) {
        if (!OTP_TYPES_BY_PATH[path]?.includes(type)) {
          return { data: null, error: new Error('Deep link type is not valid for this path') };
        }
        return supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      }
      if (accessToken && refreshToken) {
        return supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
      if (code) {
        return supabase.auth.exchangeCodeForSession(url);
      }
      return { data: null, error: new Error('Deep link did not contain a recognizable auth payload') };
    };

    const AUTH_LINK_PATHS = ['resetpassword', 'emailconfirmation', 'signin'];

    const handleDeepLink = async (event) => {
      const { url } = event;

      if (!url || !url.startsWith('keystone://')) {
        // Not our custom scheme -- most likely a Universal Link to
        // https://thekeystoneapp.com/verify (see public/.well-known/apple-app-site-association
        // in keystone-landingpage). Those are handled entirely by app/(auth)/verify.js via
        // Expo Router's own linking match, since this listener only understands keystone://.
        console.log('No usable URL in deep link event');
        return;
      }

      try {
        const { path, queryParams, hashParams } = parseDeepLink(url);

        if (AUTH_LINK_PATHS.includes(path) && (Array.from(queryParams.keys()).length || Array.from(hashParams.keys()).length)) {
          console.log('Processing auth deep link for', path);
          const { data, error } = await establishSessionFromDeepLink(path, queryParams, hashParams, url);
          if (error) {
            console.error('Failed to establish session from deep link:', error);
          } else if (data?.session) {
            console.log('Session established from deep link');
          }
          router.replace(`/${path}`);
          return;
        }

        const referralCode = queryParams.get('ref');
        if (referralCode) {
          await handleReferralDeepLink(url);
          return;
        }

        if (path === 'home') {
          router.push('/tabs/home');
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Slot />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const apiKey = process.env.EXPO_PUBLIC_SUPERWALL_API_KEY || "";

  return (
    <SuperwallProvider apiKeys={{ ios: apiKey, android: apiKey }}>
      <SuperwallLoading>
        <SplashScreen />
      </SuperwallLoading>
      <SuperwallLoaded>
        <QueryProvider>
          <SuperwallContextProvider>
            <RootShell />
          </SuperwallContextProvider>
        </QueryProvider>
      </SuperwallLoaded>
    </SuperwallProvider>
  );
}
