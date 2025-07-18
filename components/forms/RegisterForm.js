// components/RegisterForm.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { signUpUser, checkEmailExists } from '../../services/auth';
import { styles } from '../../styles/authentication';
import WaitForEmailConfirmation from '../WaitForEmailConfirmation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const router = useRouter();

  const handleBack = () => {
    router.replace('/onboarding/NotificationTime');
  };

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

  if (showConfirmation) {
    return (
      <WaitForEmailConfirmation 
        email={email}
        preferences={null}
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
      <View style={{ position: 'absolute', top: 72, left: 24, zIndex: 10 }}>
        <TouchableOpacity onPress={handleBack} style={{ width: 48, height: 48, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="arrow-back" size={48} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <Image source={require('../../assets/keystone_transparent.png')} style={styles.logo} />
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
        style={[styles.registerButton, loading && styles.disabledButton]} 
        onPress={handleSignUp} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#2b2b2b" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      {/* <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.socialContainer}>
        <TouchableOpacity style={styles.socialButton}>
          <Image source={require('../../assets/google.png')} style={styles.socialIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <Image source={require('../../assets/apple.png')} style={styles.socialIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <Image source={require('../../assets/x.png')} style={styles.socialIcon} />
        </TouchableOpacity>
      </View> */}
    </View>
  );
}