import { supabase } from '../lib/supabase';

export interface SubscriptionData {
  id: string;
  user_id: string;
  is_pro: boolean;
  free_months_remaining: number;
  subscription_start_date: string;
  subscription_end_date: string;
  referral_months_earned?: number;
  created_at: string;
  updated_at: string;
}

// Get or create user's subscription data
export const getUserSubscriptionData = async (): Promise<SubscriptionData> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Check if user already has subscription data
  let { data: subscriptionData } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!subscriptionData) {
    // Create new subscription data (free tier by default)
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        is_pro: false,
        free_months_remaining: 0,
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    subscriptionData = data;
  }

  return subscriptionData;
};

// Add free months to user's subscription
export const addFreeMonths = async (months: number, userId?: string): Promise<SubscriptionData> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Use provided userId or current user's ID
  const targetUserId = userId || user.id;

  // Get current subscription data
  const { data: subscriptionData } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', targetUserId)
    .single();

  if (!subscriptionData) {
    // Create subscription data if it doesn't exist
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: targetUserId,
        is_pro: true,
        free_months_remaining: months,
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: new Date(Date.now() + (months * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Calculate new subscription end date
  const currentEndDate = new Date(subscriptionData.subscription_end_date);
  const newEndDate = new Date(currentEndDate.getTime() + (months * 30 * 24 * 60 * 60 * 1000)); // Add months in milliseconds

  // Update subscription
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      is_pro: true,
      free_months_remaining: (subscriptionData.free_months_remaining || 0) + months,
      subscription_end_date: newEndDate.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', targetUserId)
    .select()
    .single();

  if (error) throw error;

  return data;
};

// Add free months from referral rewards
export const addReferralFreeMonths = async (months: number, userId?: string): Promise<SubscriptionData> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Use provided userId or current user's ID
  const targetUserId = userId || user.id;

  // Get current subscription data
  let { data: subscriptionData } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', targetUserId)
    .single();

  if (!subscriptionData) {
    // Create subscription data if it doesn't exist
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: targetUserId,
        is_pro: true,
        free_months_remaining: months,
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: new Date(Date.now() + (months * 30 * 24 * 60 * 60 * 1000)).toISOString(),
        referral_months_earned: months, // Track referral-specific months
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Calculate new subscription end date
  const currentEndDate = new Date(subscriptionData.subscription_end_date);
  const newEndDate = new Date(currentEndDate.getTime() + (months * 30 * 24 * 60 * 60 * 1000));

  // Update subscription with referral tracking
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      is_pro: true,
      free_months_remaining: (subscriptionData.free_months_remaining || 0) + months,
      subscription_end_date: newEndDate.toISOString(),
      referral_months_earned: (subscriptionData.referral_months_earned || 0) + months,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', targetUserId)
    .select()
    .single();

  if (error) throw error;

  return data;
};

// Check if user has active Pro subscription
export const isUserPro = async (): Promise<boolean> => {
  try {
    const subscriptionData = await getUserSubscriptionData();
    const now = new Date();
    const endDate = new Date(subscriptionData.subscription_end_date);
    
    return subscriptionData.is_pro && endDate > now;
  } catch (error) {
    console.error('Error checking Pro status:', error);
    return false;
  }
};

// Check if user has reached referral cap (6 months)
export const hasReachedReferralCap = async (userId?: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const targetUserId = userId || user.id;
    
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('referral_months_earned')
      .eq('user_id', targetUserId)
      .single();

    return (subscriptionData?.referral_months_earned || 0) >= 6;
  } catch (error) {
    console.error('Error checking referral cap:', error);
    return false;
  }
};

// Get user's subscription status
export const getSubscriptionStatus = async (): Promise<{
  isPro: boolean;
  freeMonthsRemaining: number;
  daysUntilExpiry: number;
}> => {
  try {
    const subscriptionData = await getUserSubscriptionData();
    const now = new Date();
    const endDate = new Date(subscriptionData.subscription_end_date);
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      isPro: subscriptionData.is_pro && endDate > now,
      freeMonthsRemaining: subscriptionData.free_months_remaining || 0,
      daysUntilExpiry: Math.max(0, daysUntilExpiry),
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return {
      isPro: false,
      freeMonthsRemaining: 0,
      daysUntilExpiry: 0,
    };
  }
}; 

// Get referral subscription stats
export const getReferralSubscriptionStats = async (): Promise<{
  referralMonthsEarned: number;
  monthsRemaining: number;
  hasReachedCap: boolean;
}> => {
  try {
    const subscriptionData = await getUserSubscriptionData();
    const hasReachedCap = await hasReachedReferralCap();
    
    return {
      referralMonthsEarned: subscriptionData.referral_months_earned || 0,
      monthsRemaining: subscriptionData.free_months_remaining || 0,
      hasReachedCap,
    };
  } catch (error) {
    console.error('Error getting referral subscription stats:', error);
    return {
      referralMonthsEarned: 0,
      monthsRemaining: 0,
      hasReachedCap: false,
    };
  }
}; 