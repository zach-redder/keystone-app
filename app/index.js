import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { checkUserStatus } from '../services/auth';
import SplashScreen from './SplashScreen';

export default function Index() {
  const [redirectTo, setRedirectTo] = useState(null);

  useEffect(() => {
    const check = async () => {
      const { status } = await checkUserStatus();

      console.log('status', status);
  
      if (status === 'no_session') {
        setRedirectTo('/onboarding/Welcome'); // Route to sign-up screen if no session
      } else if (status === 'brand_new') {
        setRedirectTo('/onboarding/Welcome'); // ✅ new user — start onboarding
      } else if (status === 'incomplete') {
        setRedirectTo('/onboarding/Welcome'); // signed in, resume onboarding
      } else if (status === 'complete') {
        setRedirectTo('/tabs/home');
      } else {
        console.error('Unknown error or user state.');
        setRedirectTo('/signin');
      }
    };
  
    check();
  }, []);

  if (!redirectTo) {
    return <SplashScreen />;
  }

  return <Redirect href={redirectTo} />;
}
