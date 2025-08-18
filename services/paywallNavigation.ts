import { router } from 'expo-router';
import { validateEntitlements } from './iapService';

// Navigate directly to subscription screen
export const triggerPaywall = async (returnTo?: string) => {
  try {
    router.push({
      pathname: '/subscription',
      params: { returnTo: returnTo || 'home' }
    });
  } catch (error) {
    console.error('Failed to navigate to subscription:', error);
  }
};

// Check if user has access to premium features via entitlements
export const hasPremiumAccess = async () => {
  try {
    const { isPro } = await validateEntitlements();
    return isPro;
  } catch (error) {
    console.error('Failed to check premium access:', error);
    return false;
  }
};

// Example usage in your app:
// import { triggerPaywall, hasPremiumAccess } from '../services/paywallNavigation';
// const handlePremiumFeature = async () => {
//   const hasAccess = await hasPremiumAccess();
//   if (!hasAccess) {
//     await triggerPaywall('current-screen');
//   } else {
//     // Show premium feature
//   }
// };