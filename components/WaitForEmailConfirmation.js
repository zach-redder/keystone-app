import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { insertUserProfileAfterConfirmation, resendConfirmationEmail } from '../services/auth';
import { styles } from '../styles/authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WaitForEmailConfirmationScreen({ email, preferences: initialPreferences, onTryDifferentEmail }) {
  const router = useRouter();
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const checkEmailConfirmation = async () => {
    try {
      console.log('Checking email confirmation status in auth.users table...');
      
      // We need to check the auth.users table directly to see if email_confirmed_at is not null
      // Since we can't directly query auth.users from the client, we'll use a different approach
      
      // Try to sign in with the stored credentials to check if email is confirmed
      const storedPassword = await AsyncStorage.getItem('tempPassword');
      
      if (!storedPassword) {
        console.log('No stored password found');
        return { confirmed: false, error: 'no_password' };
      }
      
      // Attempt to sign in - this will only work if email is confirmed
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: storedPassword,
      });
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          console.log('Email not yet confirmed');
          return { confirmed: false, error: null };
        } else {
          console.error('Sign in error:', error);
          return { confirmed: false, error: 'signin_error' };
        }
      }
      
      if (data.session && data.user) {
        console.log('Email confirmed! User signed in successfully.');
        console.log('User ID:', data.user.id);
        console.log('Email confirmed at:', data.user.email_confirmed_at);
        
        // Email is confirmed and user is now signed in
        return { confirmed: true, error: null };
      }
      
      console.log('Unexpected state - no error but no session');
      return { confirmed: false, error: null };
    } catch (err) {
      console.error('Error checking email confirmation:', err);
      // Check if it's a network error
      if (err.message.includes('Network request failed') || err.name === 'TypeError') {
        return { confirmed: false, error: 'network_error' };
      }
      return { confirmed: false, error: 'unknown_error' };
    }
  };

  useEffect(() => {
    // Debug session state on mount
    debugSessionState();
    
    // Listen for auth state changes (email confirmation)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session ? 'with session' : 'no session');
      
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in after email confirmation!');
        setPolling(false);
        await handleConfirmedEmail();
      }
    });
    
    let isSubscribed = true;
    const interval = setInterval(async () => {
      if (!polling) return;

      try {
        const result = await checkEmailConfirmation();
        
        // Only proceed if email is actually confirmed (user signed in)
        if (result.confirmed && isSubscribed) {
          console.log('Email confirmed and user signed in! Proceeding...');
          clearInterval(interval);
          setPolling(false);
          await handleConfirmedEmail();
        } else if (result.error === 'network_error') {
          console.log('Network error during polling, will retry...');
          // Don't do anything, just wait for next poll
        } else if (result.error === 'no_password') {
          console.log('No stored password - cannot check confirmation');
          setError('Password not found. Please try registering again.');
          setPolling(false);
        } else if (result.error === 'signin_error') {
          console.log('Sign in error during polling, will retry...');
          // Continue polling, might be temporary
        } else if (result.error && result.error !== null) {
          console.error('Error during polling:', result.error);
          // For other errors, continue polling
        }
        // If result.confirmed is false and no error, just continue polling (normal state)
      } catch (err) {
        console.error('Error in polling interval:', err);
        // Continue polling even if there's an error
      }
    }, 3000); // Poll every 3 seconds (slightly longer since we're doing sign-in attempts)

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [polling]);

  const handleConfirmedEmail = async () => {
    console.log('Starting handleConfirmedEmail...');
    setIsChecking(true);
    setError(null);
    
    try {
      // If preferences weren't passed in, try to get them from AsyncStorage
      let preferences = initialPreferences;
      if (!preferences) {
        console.log('No initial preferences, checking AsyncStorage...');
        const savedPrefs = await AsyncStorage.getItem('final_preferences');
        preferences = savedPrefs ? JSON.parse(savedPrefs) : null;
        console.log('Preferences from AsyncStorage:', preferences);
      }

      if (!preferences) {
        console.log('No preferences found, user needs to complete onboarding');
        // Clean up stored password
        await AsyncStorage.removeItem('tempPassword');
        // Don't redirect - let the main app routing handle this
        // The app will detect the user is signed in but needs onboarding
        router.replace('/');
        return;
      }

      console.log('Creating user profile with preferences:', preferences);
      // Create the user profile with preferences
      console.log('About to call insertUserProfileAfterConfirmation...');
      await insertUserProfileAfterConfirmation(preferences);
      console.log('insertUserProfileAfterConfirmation completed successfully');

      console.log('Profile created, cleaning up AsyncStorage...');
      // Clean up stored preferences and password
      await AsyncStorage.multiRemove([
        'final_preferences',
        'user_preferences',
        'tempPassword',
        'future_self_vision',
        'life_goals',
        'core_values',
        'ai_personality',
        'futureselfvision_custom_options',
        'lifegoals_custom_options',
        'corevalues_custom_options',
        'aipersonality_custom_options',
      ]);
      
      // Verify the user is properly signed in and has a session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session after email confirmation - this should not happen');
        setError('Authentication error. Please try signing in again.');
        return;
      }
      
      console.log('User session verified, navigating to main app...');
      // Navigate to main app and let the routing logic handle the correct destination
      router.replace('/');
    } catch (err) {
      console.error('Error in handleConfirmedEmail:', err);
      setError(err.message);
      setPolling(true); // Resume polling if insertion fails
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    setError(null);
    setResendSuccess(false);
    try {
      await resendConfirmationEmail(email);
      setResendSuccess(true);
      // Clear success message after 5 seconds
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      console.error('Error resending email:', err);
      setError(err.message);
    } finally {
      setIsResending(false);
    }
  };

  const handleSignInAfterConfirmation = async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      console.log('Manually checking email confirmation and signing in...');
      
      const result = await checkEmailConfirmation();
      
      if (result.confirmed) {
        console.log('Email confirmed and signed in successfully!');
        setPolling(false);
        await handleConfirmedEmail();
      } else if (result.error === 'no_password') {
        setError('Password not found. Please try registering again.');
      } else if (result.error === 'signin_error') {
        setError('Sign in failed. Please check your email confirmation.');
      } else {
        setError('Please confirm your email first by clicking the link we sent you.');
      }
      
    } catch (err) {
      console.error('Error signing in after confirmation:', err);
      setError(err.message);
    } finally {
      setIsChecking(false);
    }
  };

  const handleTryDifferentEmail = () => {
    if (onTryDifferentEmail) {
      onTryDifferentEmail();
    } else {
      router.replace('/register');
    }
  };

  // Debug function to check session state
  const debugSessionState = async () => {
    console.log('=== SESSION DEBUG ===');
    
    try {
      // Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Session error:', sessionError);
      console.log('Session exists:', !!session);
      if (session) {
        console.log('User ID:', session.user.id);
        console.log('Email:', session.user.email);
        console.log('Email confirmed:', session.user.email_confirmed_at);
      } else {
        console.log('No session - expected until email is confirmed');
      }
      
      // Check AsyncStorage
      const storedToken = await AsyncStorage.getItem('sb-supabase-auth-token');
      console.log('Stored token exists:', !!storedToken);
      
      // Check all auth-related keys
      const allKeys = await AsyncStorage.getAllKeys();
      const authKeys = allKeys.filter(key => 
        key.includes('auth') || 
        key.includes('supabase') || 
        key.includes('token')
      );
      console.log('Auth keys in storage:', authKeys);
      
    } catch (err) {
      console.error('Debug error:', err);
    }
    
    console.log('==================');
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.emailConfirmationHeader}>
          <Text style={styles.title}>Check your inbox</Text>
          <Text style={[styles.subtitle, { marginBottom: 0 }]}>
            We sent a confirmation email to:
          </Text>
          <View style={styles.emailContainer}>
            <Text style={styles.emailText}>{email}</Text>
          </View>
          <Text style={styles.description}>
            Click the link in the email to confirm your account, then you're all set!
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {resendSuccess && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>Confirmation email resent!</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          {isChecking || isResending ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#D4DE95" />
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleResendEmail}
                disabled={isResending}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>Resend Confirmation Email</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleTryDifferentEmail}
                disabled={isChecking}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Try a Different Email
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
