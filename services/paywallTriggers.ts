import { validateEntitlements } from './iapService';
import { Alert } from 'react-native';
import { router } from 'expo-router';

// Check if user can access a premium feature
export const canAccessFeature = async (_featureName: string) => {
  try {
    const { isPro } = await validateEntitlements();
    return isPro;
  } catch (error) {
    console.error('Error checking access:', error);
    return false;
  }
};

// Navigate to subscription screen for premium features
export const showPaywallForFeature = async (featureName: string) => {
  try {
    router.push({ pathname: '/subscription', params: { returnTo: 'home', feature: featureName } });
    return true; // indicates navigation attempted
  } catch (error) {
    console.error(`Error showing paywall for ${featureName}:`, error);
    Alert.alert('Error', 'Failed to load payment options. Please try again.');
    return false;
  }
};

export const canAccessUnlimitedKeys = async () => canAccessFeature('Unlimited Keys');
export const canAccessAdvancedAI = async () => canAccessFeature('Advanced AI');
export const canAccessCommunityPerks = async () => canAccessFeature('Community Perks');
export const showPaywallForUnlimitedKeys = async () => showPaywallForFeature('Unlimited Keys');
export const showPaywallForAdvancedAI = async () => showPaywallForFeature('Advanced AI');
export const showPaywallForCommunityPerks = async () => showPaywallForFeature('Community Perks');