import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { checkUserOnboardingStatus } from '../services/auth';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState(null);

  useEffect(() => {
    const determineRedirect = async () => {
      const { status } = await checkUserOnboardingStatus();

      if (status === 'not_signed_in' || status === 'complete') {
        setRedirectTo('/onboarding/SignUp'); // send to login/signup screen
      } else if (status === 'incomplete') {
        setRedirectTo('/onboarding/PreferredAIPersona');
      } else {
        setRedirectTo('/onboarding/SignUp'); // fallback
      }

      setLoading(false);
    };

    determineRedirect();
  }, []);

  if (loading) return null;

  return <Redirect href={redirectTo} />;
}
