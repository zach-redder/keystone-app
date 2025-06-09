import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { signUpUser, signInUser, insertUserProfileAfterConfirmation } from '../services/auth';
import { useRouter } from 'expo-router';
import { styles } from '../styles/SignUpSignInForm';

export default function SignUpSignInForm() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const preferences = {
    timezone: 'UTC',
    notification_opt_in: true,
    preferred_reminder_time: '09:00:00',
    preferred_ai_persona: 'gentle',
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'USER_UPDATED' || event === 'SIGNED_IN') {
        const user = session?.user;

        if (user?.email_confirmed_at) {
          try {
            await insertUserProfileAfterConfirmation(fullName, preferences);
            router.replace('/tabs/home');
          } catch (err) {
            console.error('Profile insert failed:', err.message);
            setError('Failed to finish signup.');
          }
        }
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fullName]);

  const handleAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        await signUpUser(email, password);
        // Show "check your inbox" screen here if you'd like
      } else {
        await signInUser(email, password);
        router.replace('/tabs/home');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{mode === 'signup' ? 'Create an Account' : 'Sign In'}</Text>

      {mode === 'signup' && (
        <TextInput
          placeholder="Full Name"
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
        />
      )}

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
}
