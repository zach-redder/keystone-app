import { Slot, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const handleDeepLink = async (event) => {
      const url = event.url;

      // Tell Supabase to handle the session from the URL
      const { data, error } = await supabase.auth.exchangeCodeForSession(url);

      if (error) {
        console.error("Auth redirect error:", error);
      } else {
        console.log("Session recovered!", data.session);
        router.replace('/home'); // redirect wherever you want
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle case where app is opened from cold start via email link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Slot />
    </GestureHandlerRootView>
  );
}
