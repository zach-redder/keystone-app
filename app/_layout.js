import { Slot, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeSuperwall, registerSuperwallEvents } from '../services/superwallService';

export default function RootLayout() {
  const router = useRouter();

  // Initialize Superwall on app start
  useEffect(() => {
    const initSuperwall = async () => {
      try {
        await initializeSuperwall();
        registerSuperwallEvents();
      } catch (error) {
        console.error('Failed to initialize Superwall:', error);
      }
    };
    
    initSuperwall();
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
        // Handle Supabase auth callbacks
        if (url.includes('auth/callback')) {
          console.log('Processing Supabase auth callback...');
          
          // Parse the URL to check if it's a password reset
          const urlObj = new URL(url);
          const type = urlObj.searchParams.get('type');
          
          if (type === 'recovery') {
            console.log('Password reset callback detected');
            router.replace('/resetpassword');
            return;
          }
          
          // For email confirmation, exchange the code for a session
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
            router.replace('/'); // Navigate to main app
          } else {
            console.log('No session recovered from deep link');
          }
        } else {
          // Handle other deep links (like keystone:// URLs)
          console.log('Processing other deep link:', url);
          
          // You can add more deep link handling here
          // For example, handle specific routes like keystone://subscription
          if (url.includes('subscription')) {
            router.push('/subscription');
          } else if (url.includes('home')) {
            router.push('/tabs/home');
          }
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
