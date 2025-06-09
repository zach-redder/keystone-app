import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { checkUserStatus } from '../services/auth';

export default function Index() {
  const [redirectTo, setRedirectTo] = useState(null);

  useEffect(() => {
    const check = async () => {
      const { status } = await checkUserStatus();

      console.log('status', status);
  
      if (status === 'brand_new') {
        setRedirectTo('/onboarding/PreferredAIPersona'); // ✅ new user — start onboarding
      } else if (status === 'incomplete') {
        setRedirectTo('/onboarding/PreferredAIPersona'); // signed in, resume onboarding
      } else if (status === 'complete') {
        setRedirectTo('/tabs/home');
      } else {
        console.error('Unknown error or user state.');
        setRedirectTo('/login');
      }
    };
  
    check();
  }, []);

  if (!redirectTo) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href={redirectTo} />;
}
