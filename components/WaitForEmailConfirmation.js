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
      console.log('Checking email confirmation status...');
      
      // First check if we have a session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        return false;
      }

      if (!session) {
        console.log('No active session, trying to sign in with stored credentials...');
        // Try to get a new session by signing in with stored email
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: await AsyncStorage.getItem('tempPassword') // We'll need to store this temporarily
        });

        if (signInError) {
          if (signInError.message.includes('Email not confirmed')) {
            console.log('Email still not confirmed');
            return false;
          }
          console.error('Error signing in:', signInError);
          return false;
        }

        if (data.user) {
          console.log('Successfully signed in after confirmation!');
          return true;
        }
      }

      // If we have a session, check the user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        return false;
      }

      if (!user) {
        console.log('No user found in session');
        return false;
      }

      console.log('Full user object:', user);
      console.log('Last sign in:', user.last_sign_in_at);
      
      const isConfirmed = user.last_sign_in_at && !user.last_sign_in_at.includes("Waiting");

      console.log('Is email confirmed?', isConfirmed);
      
      if (isConfirmed) {
        console.log('Email confirmed! Processing...');
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error checking email confirmation:', err);
      return false;
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    const interval = setInterval(async () => {
      if (!polling) return;

      try {
        const isConfirmed = await checkEmailConfirmation();
        
        if (isConfirmed && isSubscribed) {
          console.log('Email confirmed, clearing interval and proceeding...');
          clearInterval(interval);
          setPolling(false);
          await handleConfirmedEmail();
        }
      } catch (err) {
        console.error('Error in polling interval:', err);
      }
    }, 2000); // Poll every 2 seconds instead of 3

    return () => {
      isSubscribed = false;
      clearInterval(interval);
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
        console.log('No preferences found, redirecting to onboarding...');
        // Clean up stored password before redirecting
        await AsyncStorage.removeItem('tempPassword');
        router.replace('/onboarding/FutureSelfVision');
        return;
      }

      console.log('Creating user profile with preferences:', preferences);
      // Create the user profile with preferences
      await insertUserProfileAfterConfirmation(preferences);

      console.log('Profile created, cleaning up AsyncStorage...');
      // Clean up stored preferences and password
      await AsyncStorage.removeItem('final_preferences');
      await AsyncStorage.removeItem('user_preferences');
      await AsyncStorage.removeItem('tempPassword');
      
      console.log('Navigating to home...');
      // Navigate to home
      router.replace('/tabs/home');
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

  const handleTryDifferentEmail = () => {
    if (onTryDifferentEmail) {
      onTryDifferentEmail();
    } else {
      router.replace('/register');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Check your inbox</Text>
        <Text style={styles.subtitle}>
          We sent a confirmation email to:
        </Text>
        <Text style={styles.emailText}>{email}</Text>
        <Text style={styles.description}>
          Click the link in the email to confirm your account. If you don't see it, check your spam.
        </Text>

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
            <ActivityIndicator size="large" color="#D4DE95" />
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleResendEmail}
                disabled={isResending}
              >
                <Text style={styles.buttonText}>Resend Confirmation Email</Text>
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
