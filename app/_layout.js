import { Slot, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const handleDeepLink = async (event) => {
      const url = event.url;
      console.log("Deep link received:", url);

      // Only handle Supabase auth URLs
      if (!url || !url.includes('auth/callback')) {
        console.log("Not a Supabase auth URL, ignoring");
        return;
      }

      try {
        console.log("Processing Supabase auth callback...");
        // Tell Supabase to handle the session from the URL
        const { data, error } = await supabase.auth.exchangeCodeForSession(url);

        if (error) {
          console.error("Auth redirect error:", error);
          // Don't redirect on auth errors, let the user try again
          return;
        }

        if (data.session) {
          console.log("Session recovered from deep link!", {
            userId: data.session.user.id,
            email: data.session.user.email,
            emailConfirmed: data.session.user.email_confirmed_at
          });
          router.replace('/'); // Let the main app routing handle the destination
        } else {
          console.log("No session recovered from deep link");
        }
      } catch (error) {
        console.error("Error handling deep link:", error);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle case where app is opened from cold start via email link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("App opened with initial URL:", url);
        handleDeepLink({ url });
      } else {
        console.log("No initial URL found");
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
