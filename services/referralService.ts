import { supabase } from '../lib/supabase';
import { getAppStoreLink } from '../constants/appStore';

export interface ReferralData {
  id: string;
  user_id: string;
  referral_code: string;
  downloads_count: number;
  free_months_earned: number;
  created_at: string;
  updated_at: string;
}

// Generate a unique referral code for the user
export const generateReferralCode = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Create a unique referral code based on user ID and timestamp
  const timestamp = Date.now().toString(36);
  const userId = user.id.substring(0, 8);
  const referralCode = `${userId}${timestamp}`.toUpperCase();

  // Check if this code already exists
  const { data: existing } = await supabase
    .from('referrals')
    .select('id')
    .eq('referral_code', referralCode)
    .single();

  if (existing) {
    // If code exists, generate a new one
    return generateReferralCode();
  }

  return referralCode;
};

// Get or create user's referral data
export const getUserReferralData = async (): Promise<ReferralData> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Check if user already has referral data
  let { data: referralData } = await supabase
    .from('referrals')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!referralData) {
    // Create new referral data
    const referralCode = await generateReferralCode();
    const { data, error } = await supabase
      .from('referrals')
      .insert({
        user_id: user.id,
        referral_code: referralCode,
        downloads_count: 0,
        free_months_earned: 0,
      })
      .select()
      .single();

    if (error) throw error;
    referralData = data;
  }

  return referralData;
};

// Track when someone downloads the app using a referral code
export const trackReferralDownload = async (referralCode: string): Promise<void> => {
  // Find the user who owns this referral code (the referrer)
  const { data: referralData } = await supabase
    .from('referrals')
    .select('*')
    .eq('referral_code', referralCode)
    .single();

  if (!referralData) {
    console.log('Invalid referral code:', referralCode);
    return;
  }

  // Get the current user (the one who just downloaded - the referred user)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('No authenticated user found');
    return;
  }

  // Don't allow self-referrals
  if (user.id === referralData.user_id) {
    console.log('Self-referral not allowed');
    return;
  }

  // Increment the download count for this referral
  const newDownloadCount = (referralData.downloads_count || 0) + 1;
  
  // Calculate free months earned (1 per download, capped at 6)
  const potentialFreeMonths = newDownloadCount;
  const newFreeMonths = Math.min(potentialFreeMonths, 6); // Cap at 6 months

  const { error } = await supabase
    .from('referrals')
    .update({
      downloads_count: newDownloadCount,
      free_months_earned: newFreeMonths,
      updated_at: new Date().toISOString(),
    })
    .eq('referral_code', referralCode);

  if (error) {
    console.error('Error tracking referral download:', error);
    return;
  }

         // Add free month to the referrer's subscription (only if they haven't reached the cap)
       if (referralData.free_months_earned < 6) {
         try {
           const { addReferralFreeMonths } = await import('./subscriptionService');
           await addReferralFreeMonths(1, referralData.user_id); // Add 1 free month to referrer
         } catch (subscriptionError) {
           console.error('Error adding free month to referrer subscription:', subscriptionError);
         }
       }
       
       // Grant 1 free month to the referred user (the one who just downloaded)
       try {
         const { addReferralFreeMonths } = await import('./subscriptionService');
         await addReferralFreeMonths(1, user.id); // Add 1 free month to referred user (current user)
       } catch (subscriptionError) {
         console.error('Error adding free month to referred user subscription:', subscriptionError);
       }
};

// Get user's current referral stats
export const getReferralStats = async (): Promise<{ downloads_count: number; free_months_earned: number; next_reward_at: number }> => {
  const referralData = await getUserReferralData();
  
  // If user has already earned 6 months, no more rewards
  const nextRewardAt = referralData.free_months_earned >= 6 ? null : referralData.downloads_count + 1;
  
  return {
    downloads_count: referralData.downloads_count || 0,
    free_months_earned: referralData.free_months_earned || 0,
    next_reward_at: nextRewardAt,
  };
};

// Get the shareable referral link
export const getReferralLink = async (): Promise<string> => {
  const referralData = await getUserReferralData();
  const appLink = getAppStoreLink();
  
  // Create a referral link with the user's referral code
  return `${appLink}?ref=${referralData.referral_code}`;
}; 