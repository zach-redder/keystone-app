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
      const { url } = event;
      console.log('Deep link received:', url);
      
      // Check if this is a Supabase auth callback
      if (!url || !url.includes('auth/callback')) {
        console.log('Not a Supabase auth callback link:', url);
        return;
      }

      try {
        console.log('Processing Supabase auth callback...');
        
        // Parse the URL to check if it's a password reset
        const urlObj = new URL(url);
        const type = urlObj.searchParams.get('type');
        
        if (type === 'recovery') {
          console.log('Password reset callback detected');
          // For password reset, we need to handle it differently
          // The user will be redirected to the password reset screen
          router.replace('/resetpassword');
          return;
        }
        
        // For email confirmation, exchange the code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(url);

        if (error) {
          console.error('Auth redirect error:', error);
          // Don't redirect on auth errors, let the user try again
          return;
        }

        if (data.session) {
          console.log('Session recovered from deep link!', {
            userId: data.session.user.id,
            email: data.session.user.email,
            emailConfirmed: data.session.user.email_confirmed_at
          });
          router.replace('/'); // Let the main app routing handle the destination
        } else {
          console.log('No session recovered from deep link');
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle case where app is opened from cold start via email link
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
