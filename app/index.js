import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { checkUserStatus } from '../services/auth';
import SplashScreen from './SplashScreen';

export default function Index() {
  const [redirectTo, setRedirectTo] = useState(null);

  useEffect(() => {
    const check = async () => {
      console.log('=== MAIN APP ROUTING ===');
      const { status } = await checkUserStatus();

      console.log('Main app routing - status:', status);
  
      switch (status) {
        case 'no_session':
          // No active session, route to sign-in
          console.log('Main app routing - Redirecting to /signin');
          setRedirectTo('/signin');
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
          
        case 'ready_for_subscription':
          // User has completed quiz and user info, ready for subscription
          console.log('Main app routing - Redirecting to /onboarding/Subscription');
          setRedirectTo('/onboarding/Subscription');
          break;
          
        case 'subscription_complete':
          // User has subscribed but onboarding not marked complete in database
          console.log('Main app routing - Redirecting to /onboarding/Subscription');
          setRedirectTo('/onboarding/Subscription');
          break;
          
        case 'complete':
          // User has completed onboarding, route to home
          console.log('Main app routing - Redirecting to /tabs/home');
          setRedirectTo('/tabs/home');
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
  }, []);

  if (!redirectTo) {
    return <SplashScreen />;
  }

  return <Redirect href={redirectTo} />;
}
