// components/SignInForm.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { signInUser, resetPassword, signInWithGoogle, signInWithApple } from '../../services/auth/auth';
import { styles } from '../../styles/authentication';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function SignInForm() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      await signInUser(email, password);
      router.replace('/');
    } catch (err) {
      const msg = err?.message?.toLowerCase() || '';
      if (msg.includes('missing email or phone')) {
        setError('Please enter your email and password.');
      } else {
        setError(err.message || 'Something went wrong.');
        // Only log unexpected errors
        if (!msg.includes('missing email or phone')) {
          console.error('Unexpected sign-in error:', err);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address first.');
      return;
    }

    setResetLoading(true);
    try {
      await resetPassword(email);
      Alert.alert(
        'Password Reset Sent',
        'Check your email for password reset instructions.',
        [{ text: 'OK' }]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to send password reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/onboarding/Welcome');
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
        router.replace('/');
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
        router.replace('/');
      }
    } catch (err) {
      console.error('Apple sign-in error:', err);
      setError(err.message || 'Failed to sign in with Apple');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={48} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <Image source={require('../../assets/images/logos/keystone_transparent.png')} style={styles.logo} />
      <Text style={styles.title}>Log in to your account.</Text>

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

      <View style={styles.forgotPasswordContainer}>
        <TouchableOpacity onPress={handleForgotPassword} disabled={resetLoading}>
          <Text style={styles.forgotPasswordText}>
            {resetLoading ? 'Sending...' : 'Forgot Password?'}
          </Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.registerButton, (loading || oauthLoading) && styles.disabledButton]}
        onPress={handleSignIn}
        disabled={loading || oauthLoading}
      >
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.signInSocialContainer}>
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