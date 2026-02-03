import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Handle purchase completion and update user's pro status
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

// Migrate existing IAP users to Superwall
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