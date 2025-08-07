import { checkSubscriptionStatus, triggerPaywallEvent } from './superwallService';
import { Alert } from 'react-native';

// Check if user can access a premium feature
export const canAccessFeature = async (featureName: string) => {
  try {
    const isSubscribed = await checkSubscriptionStatus();
    return isSubscribed;
  } catch (error) {
    console.error(`Error checking access for ${featureName}:`, error);
    return false;
  }
};

// Navigate to subscription screen for premium features
export const showPaywallForFeature = async (featureName: string) => {
  try {
    // Trigger paywall event for Superwall tracking
    await triggerPaywallEvent();
    
    // Navigate to subscription screen (you'll need to implement navigation)
    // This is a placeholder - you'll need to pass navigation or use router
    console.log(`Navigate to subscription screen for ${featureName}`);
    return false;
  } catch (error) {
    console.error(`Error showing paywall for ${featureName}:`, error);
    Alert.alert('Error', 'Failed to load payment options. Please try again.');
    return false;
  }
};

// Specific feature checks
export const canAccessUnlimitedKeys = async () => {
  return await canAccessFeature('Unlimited Keys');
};

export const canAccessAdvancedAI = async () => {
  return await canAccessFeature('Advanced AI');
};

export const canAccessCommunityPerks = async () => {
  return await canAccessFeature('Community Perks');
};

// Show paywall for unlimited keys
export const showPaywallForUnlimitedKeys = async () => {
  return await showPaywallForFeature('Unlimited Keys');
};

// Show paywall for advanced AI
export const showPaywallForAdvancedAI = async () => {
  return await showPaywallForFeature('Advanced AI');
};

// Show paywall for community perks
export const showPaywallForCommunityPerks = async () => {
  return await showPaywallForFeature('Community Perks');
}; 