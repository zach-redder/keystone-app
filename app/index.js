import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { checkUserStatus } from '../services/auth/auth';
import { getPostSignupResume, getPreAuthResume } from '../services/onboarding/resumeStorage';
import { getAccessDecision } from '../services/subscription/accessGateService';
import SplashScreen from './SplashScreen';

export default function Index() {
  const [redirectTo, setRedirectTo] = useState(null);

  useEffect(() => {
    const check = async () => {
      const { status } = await checkUserStatus();

      switch (status) {
        case 'no_session':
          // Picks a killed app back up where the user left off before creating an account
          setRedirectTo((await getPreAuthResume()) ?? '/onboarding/Welcome');
          break;

        case 'needs_email_confirmation':
          setRedirectTo('/register');
          break;

        case 'needs_onboarding':
          setRedirectTo('/onboarding/Welcome');
          break;

        case 'needs_profile':
          // Signed in and confirmed, but the profile was never created; the confirmation
          // screen finishes it from the selections still stored locally
          setRedirectTo('/emailconfirmation');
          break;

        case 'complete': {
          // After sign-up the notification, rating and paywall screens still follow
          const resume = await getPostSignupResume();
          if (resume) {
            setRedirectTo(resume);
          } else {
            setRedirectTo((await getAccessDecision()) === 'allow' ? '/tabs/home' : '/onboarding/FreeTrial');
          }
          break;
        }

        default:
          console.error('Unexpected user status:', status);
          setRedirectTo('/signin');
          break;
      }
    };

    check();
  }, []);

  if (!redirectTo) {
    return <SplashScreen />;
  }

  return <Redirect href={redirectTo} />;
}
