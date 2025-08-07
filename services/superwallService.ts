import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Import Superwall properly
import { Superwall } from 'expo-superwall';

// Initialize Superwall with your API key
export const initializeSuperwall = async () => {
  try {
    const apiKey = Constants.expoConfig?.extra?.superwallApiKey;
    
    if (!apiKey) {
      console.error('Superwall API key not found. Please set EXPO_PUBLIC_SUPERWALL_API_KEY in your environment variables.');
      return;
    }

    await Superwall.configure({
      apiKey: apiKey,
      logging: __DEV__ ? 'debug' : 'error',
    });
    console.log('Superwall initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Superwall:', error);
  }
};

// Trigger subscription required event for Superwall
export const triggerPaywallEvent = async () => {
  try {
    await Superwall.track('subscription_required');
    console.log('Subscription required event triggered');
  } catch (error) {
    console.error('Failed to trigger subscription event:', error);
  }
};

// Check subscription status
export const checkSubscriptionStatus = async () => {
  try {
    const isSubscribed = await Superwall.isSubscribed();
    return isSubscribed;
  } catch (error) {
    console.error('Failed to check subscription status:', error);
    return false;
  }
};

// Handle purchase
export const handlePurchase = async (productId: string) => {
  try {
    const result = await Superwall.purchase(productId);
    return result;
  } catch (error) {
    console.error('Failed to purchase product:', error);
    throw error;
  }
};

// Restore purchases
export const restorePurchases = async () => {
  try {
    const result = await Superwall.restorePurchases();
    return result;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    throw error;
  }
};

// Register for Superwall events
export const registerSuperwallEvents = () => {
  Superwall.addEventListener('paywall_open', (event) => {
    console.log('Paywall opened:', event);
  });

  Superwall.addEventListener('paywall_close', (event) => {
    console.log('Paywall closed:', event);
  });

  Superwall.addEventListener('transaction_start', (event) => {
    console.log('Transaction started:', event);
  });

  Superwall.addEventListener('transaction_fail', (event) => {
    console.log('Transaction failed:', event);
  });

  Superwall.addEventListener('transaction_complete', (event) => {
    console.log('Transaction completed:', event);
  });

  Superwall.addEventListener('subscription_start', (event) => {
    console.log('Subscription started:', event);
  });

  Superwall.addEventListener('subscription_cancel', (event) => {
    console.log('Subscription cancelled:', event);
  });
}; 