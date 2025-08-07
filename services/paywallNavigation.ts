import { triggerPaywallEvent, checkSubscriptionStatus } from './superwallService';
import { router } from 'expo-router';

// Trigger paywall event and navigate to subscription screen
export const triggerPaywall = async (returnTo?: string) => {
  try {
    // Trigger the paywall presented event for Superwall tracking
    await triggerPaywallEvent();
    
    // Navigate to subscription screen
    router.push({
      pathname: '/subscription',
      params: { returnTo: returnTo || 'home' }
    });
  } catch (error) {
    console.error('Failed to trigger paywall:', error);
  }
};

// Check if user has access to premium features
export const hasPremiumAccess = async () => {
  try {
    return await checkSubscriptionStatus();
  } catch (error) {
    console.error('Failed to check premium access:', error);
    return false;
  }
};

// Example usage in your app:
// 
// import { triggerPaywall, hasPremiumAccess } from '../services/paywallNavigation';
// 
// // When user tries to access premium feature
// const handlePremiumFeature = async () => {
//   const hasAccess = await hasPremiumAccess();
//   if (!hasAccess) {
//     await triggerPaywall('current-screen');
//   } else {
//     // Show premium feature
//   }
// }; 