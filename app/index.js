import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { checkUserStatus } from '../services/auth';
import SplashScreen from './SplashScreen';
import SubscriptionGate from '../components/SubscriptionGate';
import { getSuperwallImplementation } from '../utils/superwallCompat';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { usePlacement } = getSuperwallImplementation();

export default function Index() {
  const [redirectTo, setRedirectTo] = useState(null);
  const [hasShownOnboardingPaywall, setHasShownOnboardingPaywall] = useState(false);
  const { registerPlacement } = usePlacement({
    onDismiss: (paywallInfo, result) => {
      console.log('Onboarding paywall dismissed:', paywallInfo, result);
      // After paywall is dismissed (whether purchased or not), proceed to main app
      setHasShownOnboardingPaywall(true);
      // Navigate to main app
      setRedirectTo('/tabs/home');
    },
  });

  useEffect(() => {
    const check = async () => {
      console.log('=== MAIN APP ROUTING ===');
      const { status } = await checkUserStatus();

      console.log('Main app routing - status:', status);
  
      switch (status) {
        case 'no_session':
          // No active session, route to sign-in
          console.log('Main app routing - Redirecting to /signin');
          setRedirectTo('/onboarding/Welcome');
          break;
          
        case 'needs_email_confirmation':
          // User signed up but email not confirmed
          console.log('Main app routing - Redirecting to /register');
          setRedirectTo('/register');
          break;
          
        case 'needs_onboarding':
          // Brand new user or user who needs to start onboarding
          console.log('Main app routing - Redirecting to /onboarding/Welcome');
          setRedirectTo('/onboarding/Welcome');
          break;
          
        case 'needs_quiz':
          // User has started identity keys but needs to complete quiz
          console.log('Main app routing - Redirecting to /onboarding/Quiz/1');
          setRedirectTo('/onboarding/Quiz/1');
          break;
          
        case 'needs_user_info':
          // User has completed quiz but needs to enter user info
          console.log('Main app routing - Redirecting to /onboarding/Quiz/UserInfo');
          setRedirectTo('/onboarding/Quiz/UserInfo');
          break;
          
        case 'needs_referral_code':
          // User has completed quiz and user info, ready for referral code step
          console.log('Main app routing - Redirecting to /onboarding/ReferralCode');
          setRedirectTo('/onboarding/ReferralCode');
          break;
          
        case 'complete':
          // User has completed onboarding - show paywall before routing to main app
          console.log('Main app routing - User onboarding complete, showing paywall...');
          
          // Check if we've already shown the paywall for this onboarding session
          const hasShownPaywall = await AsyncStorage.getItem('onboarding_paywall_shown');
          
          if (!hasShownPaywall && !hasShownOnboardingPaywall) {
            // Mark that we're showing the paywall
            await AsyncStorage.setItem('onboarding_paywall_shown', 'true');
            
            // Trigger Superwall paywall
            try {
              await registerPlacement({
                placement: 'onboarding_complete',
                feature: () => {
                  console.log('User has subscription - proceeding to main app');
                  // If user already has subscription, proceed directly
                  setHasShownOnboardingPaywall(true);
                  setRedirectTo('/tabs/home');
                }
              });
              // Note: If paywall is shown and dismissed, onDismiss callback will handle navigation
            } catch (error) {
              console.warn('Error presenting onboarding paywall:', error);
              // On error, proceed to main app anyway
              setHasShownOnboardingPaywall(true);
              setRedirectTo('/tabs/home');
            }
          } else {
            // Already shown paywall, proceed to main app
            setRedirectTo('/tabs/home');
          }
          break;
          
        case 'error':
          // Database error, route to sign-in as fallback
          console.error('Database error in user status check');
          console.log('Main app routing - Redirecting to /signin (error)');
          setRedirectTo('/signin');
          break;
          
        default:
          // Unknown status, route to sign-in as fallback
          console.error('Unknown user status:', status);
          console.log('Main app routing - Redirecting to /signin (unknown)');
          setRedirectTo('/signin');
          break;
      }
    };
  
    check();
  }, [hasShownOnboardingPaywall]);

  if (!redirectTo) {
    return <SplashScreen />;
  }

  return <Redirect href={redirectTo} />;
}
