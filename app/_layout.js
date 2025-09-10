import { Slot, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { setupReminderNotifications } from '../services/reminderService';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

function RootShell() {
  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const midnightTimeoutRef = useRef(null);

  useEffect(() => {
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
    const handleDeepLink = async (event) => {
      const { url } = event;
      console.log('Deep link received:', url);
      
      if (!url) {
        console.log('No URL in deep link event');
        return;
      }

      try {
        if (url.includes('auth/callback')) {
          console.log('Processing Supabase auth callback...');
          const urlObj = new URL(url);
          const type = urlObj.searchParams.get('type');
          
          if (type === 'recovery') {
            console.log('Password reset callback detected');
            router.replace('/resetpassword');
            return;
          }
          const { data, error } = await supabase.auth.exchangeCodeForSession(url);
          if (error) {
            console.error('Auth redirect error:', error);
            return;
          }
          if (data.session) {
            console.log('Session recovered from deep link!', {
              userId: data.session.user.id,
              email: data.session.user.email,
              emailConfirmed: data.session.user.email_confirmed_at
            });
            router.replace('/');
          } else {
            console.log('No session recovered from deep link');
          }
        } else {
          console.log('Processing other deep link:', url);
          if (url.includes('home')) {
            router.push('/tabs/home');
          }
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('App opened with initial URL:', url);
        handleDeepLink({ url });
      } else {
        console.log('No initial URL found');
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
  const superwallApiKey = Constants.expoConfig?.extra?.superwallApiKey;
  
  // Log Superwall configuration for debugging
  console.log('Superwall API Key configured:', superwallApiKey ? 'Yes' : 'No');
  if (!superwallApiKey) {
    console.warn('Superwall API Key not found in app.config.js. Please ensure EXPO_PUBLIC_SUPERWALL_API_KEY is set in your environment.');
  }
  
  return (
    <RootShell />
  );
}
