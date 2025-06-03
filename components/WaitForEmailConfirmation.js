import { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { supabase } from '../lib/supabase';
import { insertUserProfileAfterConfirmation } from '../services/auth';

export default function WaitForEmailConfirmationScreen({ fullName, preferences }) {
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session && data.session.user) {
        clearInterval(interval);
        try {
          await insertUserProfileAfterConfirmation(fullName, preferences);
          // Navigate to first onboarding step or home
          router.replace('/onboarding/PreferredAIPersona');
        } catch (err) {
          setError(err.message);
        }
      }
    }, 3000); // poll every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 18 }}>Check your inbox to confirm your email.</Text>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <Button title="Retry Now" onPress={async () => {
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session && data.session.user) {
            await insertUserProfileAfterConfirmation(fullName, preferences);
            router.replace('/onboarding/PreferredAIPersona');
          }
        } catch (err) {
          setError(err.message);
        }
      }} />
    </View>
  );
}
