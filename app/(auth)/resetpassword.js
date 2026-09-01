import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { updateUserPassword } from '../../services/auth/auth';
import { styles } from '../../styles/authentication';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessingDeepLink, setIsProcessingDeepLink] = useState(true);

  useEffect(() => {
    // The session (if any) is already established by app/_layout.js's central deep-link
    // handler before it navigates here -- this just confirms one exists rather than
    // re-parsing the URL and re-attempting the exchange a second time.
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Invalid or expired password reset link. Please request a new one.');
        }
      } catch (error) {
        console.error('Error checking session for password reset:', error);
        setError('Error processing password reset link. Please try again.');
      } finally {
        setIsProcessingDeepLink(false);
      }
    };

    checkSession();
  }, []);

  const handleResetPassword = async () => {
    setError(null);
    if (!password || !confirmPassword) {
      setError('Please fill in both fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await updateUserPassword(password);
      Alert.alert('Success', 'Your password has been reset.', [
        {
          text: 'OK',
          onPress: () => router.replace('/signin'),
        },
      ]);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/signin');
  };

  if (isProcessingDeepLink) {
    return (
      <View style={styles.container}>
        <Image source={require('../../assets/images/logos/keystone_transparent.png')} style={styles.logo} />
        <Text style={styles.title}>Processing Password Reset</Text>
        <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 20 }} />
        <Text style={[styles.error, { textAlign: 'center', marginTop: 10 }]}>
          Please wait while we verify your reset link...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={48} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <Image source={require('../../assets/images/logos/keystone_transparent.png')} style={styles.logo} />
      <Text style={styles.title}>Reset Your Password</Text>
      <TextInput
        placeholder="New Password"
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        placeholder="Confirm New Password"
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        style={styles.input}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity
        style={[styles.registerButton, loading && styles.disabledButton]}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#2b2b2b" />
        ) : (
          <Text style={styles.buttonText}>Reset Password</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
