// components/RegisterForm.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { signUpUser } from '../../services/auth';
import { styles } from '../../styles/authentication';
import WaitForEmailConfirmation from '../WaitForEmailConfirmation';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Sign up the user
      await signUpUser(email, password);
      // Store password temporarily for the confirmation process
      await AsyncStorage.setItem('tempPassword', password);
      setShowConfirmation(true);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
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

      <View style={styles.dividerContainer}>
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
      </View>
    </View>
  );
}