import { getSessionUser } from '../auth/currentUser';
import { supabase } from '../../lib/supabase';
import { queryClient, queryKeys } from '../../lib/queryClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Single owner of pro/free subscription status. Previously this logic was split
// across services/auth/auth.ts, services/user/referralService.ts, and
// services/integrations/superwallService.ts, each independently reading/writing
// users.is_pro / subscription_source.

const PRO_STATUS_STALE_MS = 2 * 60 * 1000;

// Throws on lookup failures so a network blip is never cached as "not Pro"
const loadProStatus = async (): Promise<boolean> => {
    const { data: { user } } = await getSessionUser();

    if (!user) {
      return false;
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('is_pro, pro_expires_at, subscription_source')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    if (!userData?.is_pro) {
      return false;
    }

    // Real (Superwall/Apple/Google-billed) subscriptions are the source of truth for
    // their own status via the webhook -- never compare pro_expires_at for these.
    if (userData.subscription_source === 'superwall') {
      return true;
    }

    // Anything else is a comp grant (referral code or free-month offer). Enforce
    // expiry lazily here, since there's no cron/scheduling infra in this stack --
    // this is the one place nearly every feature-gate already calls.
    if (userData.pro_expires_at && new Date(userData.pro_expires_at) < new Date()) {
      await supabase.from('users').update({ is_pro: false }).eq('id', user.id);
      return false;
    }

    return true;
};

export const checkUserProStatus = async (): Promise<boolean> => {
  try {
    return await queryClient.fetchQuery({
      queryKey: queryKeys.proStatus,
      queryFn: loadProStatus,
      staleTime: PRO_STATUS_STALE_MS,
    });
  } catch (error) {
    console.error('Error checking user pro status:', error);
    return false;
  }
};

const invalidateProStatus = () => queryClient.invalidateQueries({ queryKey: queryKeys.proStatus });

export const upgradeUserToPro = async (userId?: string) => {
  try {
    const {
      data: { user },
      error: authError,
    } = await getSessionUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const targetUserId = userId || user.id;

    const { error: updateError } = await supabase
      .from('users')
      .update({ is_pro: true })
      .eq('id', targetUserId);

    if (updateError) {
      throw updateError;
    }

    await invalidateProStatus();
    console.log('Successfully upgraded user to pro:', targetUserId);
    return true;
  } catch (error) {
    console.error('Error upgrading user to pro:', error);
    throw error;
  }
};

export const downgradeUserToFree = async (userId?: string) => {
  try {
    const {
      data: { user },
      error: authError,
    } = await getSessionUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const targetUserId = userId || user.id;

    const { error: updateError } = await supabase
      .from('users')
      .update({ is_pro: false })
      .eq('id', targetUserId);

    if (updateError) {
      throw updateError;
    }

    await invalidateProStatus();
    console.log('Successfully downgraded user to free:', targetUserId);
    return true;
  } catch (error) {
    console.error('Error downgrading user to free:', error);
    throw error;
  }
};

// Handle purchase completion and update user's pro status
export const handleSuperwallPurchaseComplete = async (transactionData: any) => {
  try {
    const { data: { user } } = await getSessionUser();

    if (!user) {
      console.error('No authenticated user for purchase completion');
      return false;
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_pro: true,
          subscription_source: 'superwall',
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user pro status:', updateError);
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase.from('users').insert([
        {
          id: user.id,
          email: user.email ?? null,
          name: null,
          is_pro: true,
          subscription_source: 'superwall',
          onboarding_complete: false,
        },
      ]);

      if (insertError) {
        console.error('Error inserting user on purchase (pro):', insertError);
        throw insertError;
      }
    }

    await AsyncStorage.removeItem('pending_subscription');
    await invalidateProStatus();
    console.log('Successfully processed Superwall purchase completion');
    return true;
  } catch (error) {
    console.error('Error handling Superwall purchase completion:', error);
    throw error;
  }
};

// Migrate existing IAP users to Superwall. Called once per session from
// SuperwallContext's user-init effect -- this is the single owner of that migration;
// there used to be a second, duplicate inline copy in auth.ts's post-signup flow.
export const migrateFromIAPToSuperwall = async () => {
  try {
    const { data: { user } } = await getSessionUser();

    if (!user) {
      return false;
    }

    // One-time per account on this device: it used to cost two network calls on every launch
    const doneKey = `iap_migration_done_${user.id}`;
    if (await AsyncStorage.getItem(doneKey)) {
      return true;
    }

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
    await AsyncStorage.setItem(doneKey, '1');

    return true;
  } catch (error) {
    console.error('Error migrating from IAP to Superwall:', error);
    return false;
  }
};

/**
 * Get user's detailed subscription information including type
 */
export const getUserSubscriptionDetails = async (): Promise<{
  isPro: boolean;
  subscriptionType: 'monthly' | 'yearly' | 'lifetime' | 'free';
  displayName: string;
  source: 'referral' | 'purchase' | 'free';
  expiresAt?: string;
}> => {
  try {
    const { data: { user }, error: userError } = await getSessionUser();
    if (userError || !user) {
      return {
        isPro: false,
        subscriptionType: 'free',
        displayName: 'Free Plan',
        source: 'free'
      };
    }

    // Get user data including subscription details
    const { data: userData, error } = await supabase
      .from('users')
      .select('is_pro, referral_subscription_type, pro_expires_at')
      .eq('id', user.id)
      .single();

    if (error || !userData) {
      return {
        isPro: false,
        subscriptionType: 'free',
        displayName: 'Free Plan',
        source: 'free'
      };
    }

    if (!userData.is_pro) {
      return {
        isPro: false,
        subscriptionType: 'free',
        displayName: 'Free Plan',
        source: 'free'
      };
    }

    // Check if it's a referral subscription
    if (userData.referral_subscription_type) {
      const type = userData.referral_subscription_type as 'monthly' | 'yearly' | 'lifetime';

      // Check if referral subscription has expired
      if (userData.pro_expires_at && type !== 'lifetime') {
        const expiresAt = new Date(userData.pro_expires_at);
        const now = new Date();

        if (now > expiresAt) {
          return {
            isPro: false,
            subscriptionType: 'free',
            displayName: 'Free Plan (Expired)',
            source: 'free'
          };
        }
      }

      const displayNames = {
        monthly: 'Pro Monthly',
        yearly: 'Pro Yearly',
        lifetime: 'Pro Lifetime'
      };

      return {
        isPro: true,
        subscriptionType: type,
        displayName: displayNames[type],
        source: 'referral',
        expiresAt: userData.pro_expires_at
      };
    }

    // If pro but no referral type, assume it's a regular purchase
    return {
      isPro: true,
      subscriptionType: 'yearly', // Default assumption for purchased subscriptions
      displayName: 'Pro Plan',
      source: 'purchase'
    };

  } catch (error) {
    console.error('Error getting subscription details:', error);
    return {
      isPro: false,
      subscriptionType: 'free',
      displayName: 'Free Plan',
      source: 'free'
    };
  }
};
