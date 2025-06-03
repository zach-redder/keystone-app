import React, { useState } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator } from 'react-native';
import { signUpUser, signInUser } from '../services/auth';
import { useRouter } from 'expo-router';
import { styles } from '../styles/SignUpSignInForm';

export default function SignUpSignInForm() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        await signUpUser(email, password);
      } else {
        await signInUser(email, password);
      }

      router.replace('/tabs/home');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{mode === 'signup' ? 'Create an Account' : 'Sign In'}</Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Button title={mode === 'signup' ? 'Sign Up' : 'Sign In'} onPress={handleAuth} disabled={loading} />

      {loading && <ActivityIndicator style={{ marginTop: 10 }} />}

      <Text style={styles.toggle} onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
        {mode === 'signup' ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
      </Text>
    </View>
  );
};
