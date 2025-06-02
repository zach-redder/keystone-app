import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const user = supabase.auth.user();
      console.log('User:', user); // Debugging log

      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('onboarding_complete')
          .eq('id', user.id)
          .single();

        console.log('Data:', data); // Debugging log
        console.log('Error:', error); // Debugging log

        if (error) {
          console.error('Error fetching onboarding status:', error);
        } else {
          setOnboardingComplete(data.onboarding_complete);
        }
      } else {
        console.log('No authenticated user found.');
        setOnboardingComplete(false); // Ensure onboarding is not complete
      }
      setLoading(false);
    };

    checkOnboardingStatus();
  }, []);

  if (!loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return onboardingComplete ? <Redirect href="/tabs/home" /> : <Redirect href="/onboarding" />;
}