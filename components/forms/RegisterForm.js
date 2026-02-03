// components/RegisterForm.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { signUpUser, checkEmailExists, signInWithGoogle, signInWithApple } from '../../services/auth/auth';
import { styles } from '../../styles/authentication';
import WaitForEmailConfirmation from '../../app/(auth)/emailconfirmation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [oauthLoading, setOauthLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill out all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get preferences from AsyncStorage before proceeding
      const savedPrefs = await AsyncStorage.getItem('final_preferences');
      let userPreferences = savedPrefs ? JSON.parse(savedPrefs) : null;
      
      console.log('Retrieved preferences from AsyncStorage:', userPreferences);
      
      // If no preferences found, create default preferences
      if (!userPreferences) {
        console.log('No preferences found, creating default preferences');
        userPreferences = {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          notification_opt_in: true,
          preferred_reminder_time: '12:00:00',
          preferred_ai_persona: 'Gentle Guide',
        };
        
        // Save the default preferences
        await AsyncStorage.setItem('final_preferences', JSON.stringify(userPreferences));
        console.log('Default preferences created and saved:', userPreferences);
      }
      
      setPreferences(userPreferences);
      
      // Check if email already exists in the database
      const exists = await checkEmailExists(email);
      if (exists) {
        setError('This email is already registered. Please sign in or use a different email.');
        setLoading(false);
        return;
      }
      // Sign up the user
      await signUpUser(email, password);
      // Store password temporarily for the confirmation process
      await AsyncStorage.setItem('tempPassword', password);
      setShowConfirmation(true);
    } catch (err) {
      // Show a user-friendly error for missing fields or known auth errors
      const msg = err?.message?.toLowerCase() || '';
      if (
        msg.includes('anonymous sign-ins are disabled') ||
        msg.includes('invalid')
      ) {
        setError('Please fill out all fields.');
      } else if (msg.includes('password should be at least 8 characters')) {
        setError('Password must be at least 8 characters and include a number, a lowercase and an uppercase letter.');
      } else if (
        msg.includes('user already registered') ||
        msg.includes('email already in use') ||
        msg.includes('email address is already registered')
      ) {
        setError('This email is already registered. Please sign in or use a different email.');
      } else {
        setError(err.message || 'Something went wrong.');
        // Only log unexpected errors
        if (!msg.includes('password') && !msg.includes('anonymous sign-ins are disabled') && !msg.includes('invalid') && !msg.includes('already')) {
          console.error('Unexpected signup error:', err);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setOauthLoading(true);
      setError(null);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const user = await signInWithGoogle();

      if (user) {
        console.log('Google sign-in successful, navigating to home...');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/tabs/home');
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Failed to sign in with Google');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setOauthLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setOauthLoading(true);
      setError(null);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const user = await signInWithApple();

      if (user) {
        console.log('Apple sign-in successful, navigating to home...');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/tabs/home');
      }
    } catch (err) {
      console.error('Apple sign-in error:', err);
      setError(err.message || 'Failed to sign in with Apple');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setOauthLoading(false);
    }
  };

  if (showConfirmation) {
    return (
      <WaitForEmailConfirmation 
        email={email}
        preferences={preferences}
        onTryDifferentEmail={() => {
          setShowConfirmation(false);
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/logos/keystone_transparent.png')} style={styles.logo} />
      <Text style={styles.title}>Register to get started!</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        placeholder="Confirm Password"
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        style={styles.input}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.registerButton, (loading || oauthLoading) && styles.disabledButton]}
        onPress={handleSignUp}
        disabled={loading || oauthLoading}
      >
        {loading ? (
          <ActivityIndicator color="#2b2b2b" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.socialContainer}>
        <TouchableOpacity
          style={[styles.socialButton, oauthLoading && styles.disabledButton]}
          onPress={handleGoogleSignIn}
          disabled={loading || oauthLoading}
        >
          <Ionicons name="logo-google" size={40} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.socialButton, oauthLoading && styles.disabledButton]}
          onPress={handleAppleSignIn}
          disabled={loading || oauthLoading}
        >
          <Ionicons name="logo-apple" size={40} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}