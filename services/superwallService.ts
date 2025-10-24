import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SuperwallSubscriptionStatus {
  isActive: boolean;
  productId?: string;
  expiresAt?: string;
  isTrialPeriod?: boolean;
}

export const identifyUserWithSuperwall = async (userId: string, userAttributes?: Record<string, any>) => {
  try {
    // This would typically be called from the component using useUser hook
    console.log('User identified with Superwall:', userId, userAttributes);
    return true;
  } catch (error) {
    console.error('Error identifying user with Superwall:', error);
    throw error;
  }
};

export const checkSuperwallSubscriptionStatus = async (): Promise<SuperwallSubscriptionStatus> => {
  try {
    // This would typically be called from the component using useUser hook
    // For now, return a placeholder that can be overridden by the actual hook
    console.log('Checking Superwall subscription status...');
    
    // Default to checking database for fallback
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { isActive: false };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_pro')
      .eq('id', user.id)
      .single();

    return {
      isActive: userData?.is_pro || false
    };
  } catch (error) {
    console.error('Error checking Superwall subscription status:', error);
    return { isActive: false };
  }
};

export const handleSuperwallPurchaseComplete = async (transactionData: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user for purchase completion');
      return false;
    }

    // Update user pro status in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        is_pro: true,
        subscription_source: 'superwall'
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user pro status:', updateError);
      throw updateError;
    }

    // Clear any pending subscription data from old IAP system
    await AsyncStorage.removeItem('pending_subscription');

    console.log('Successfully processed Superwall purchase completion');
    return true;
  } catch (error) {
    console.error('Error handling Superwall purchase completion:', error);
    throw error;
  }
};

export const handleSuperwallSubscriptionStart = async (subscriptionData: any) => {
  try {
    console.log('Superwall subscription started:', subscriptionData);
    
    // Additional subscription start logic can be added here
    // e.g., analytics tracking, user onboarding, etc.
    
    return true;
  } catch (error) {
    console.error('Error handling Superwall subscription start:', error);
    throw error;
  }
};

export const handleSuperwallRestorePurchases = async () => {
  try {
    // This would typically be called from the component using useUser hook
    // The actual restore logic is handled by Superwall SDK
    console.log('Restoring Superwall purchases...');
    
    // Additional restore logic can be added here if needed
    return true;
  } catch (error) {
    console.error('Error restoring Superwall purchases:', error);
    throw error;
  }
};

// Helper function to migrate existing IAP users to Superwall
export const migrateFromIAPToSuperwall = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    // Check if user has existing pro status from IAP
    const { data: userData } = await supabase
      .from('users')
      .select('is_pro, subscription_source')
      .eq('id', user.id)
      .single();

    if (userData?.is_pro && !userData?.subscription_source) {
      // User is pro but no subscription source set - likely from old IAP system
      const { error: updateError } = await supabase
        .from('users')
        .update({ subscription_source: 'migrated_from_iap' })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating subscription source:', updateError);
      } else {
        console.log('Successfully migrated IAP user to Superwall');
      }
    }

    // Clear any pending IAP subscription data
    await AsyncStorage.removeItem('pending_subscription');

    return true;
  } catch (error) {
    console.error('Error migrating from IAP to Superwall:', error);
    return false;
  }
};