import { supabase } from '../../lib/supabase';
import { upgradeUserToPro, downgradeUserToFree } from '../subscription/subscriptionService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ReferralCode {
  code: string;
  subscription_type: 'monthly' | 'yearly' | 'lifetime';
  description: string;
  duration_months?: number; // For temporary subscriptions
  is_active: boolean;
  usage_limit?: number;
  used_count: number;
  created_at: string;
  expires_at?: string;
}

export interface ReferralRedemption {
  id: string;
  user_id: string;
  referral_code: string;
  subscription_type: string;
  redeemed_at: string;
  expires_at?: string;
}

/**
 * 🔒 BACKEND-ONLY REFERRAL CODES
 * 
 * All referral codes are now stored in the Supabase 'referral_codes' table.
 * 
 * To create referral codes, insert them directly into your Supabase database:
 * 
 * Example SQL to add codes to your 'referral_codes' table:
 * 
 * INSERT INTO referral_codes (code, subscription_type, description, duration_months, is_active, usage_limit, used_count) VALUES
 * ('KEYSTONE30', 'monthly', '30-day free trial access', 1, true, 100, 0),
 * ('LAUNCH2024', 'yearly', 'Free yearly subscription for early adopters', 12, true, 50, 0),
 * ('LIFETIME100', 'lifetime', 'Lifetime access for special users', NULL, true, 10, 0),
 * ('BETA2024', 'yearly', 'Beta tester yearly access', 12, true, 200, 0),
 * ('FRIEND30', 'monthly', 'Friend referral - 30 days free', 1, true, 1000, 0),
 * ('VIP2024', 'lifetime', 'VIP lifetime access', NULL, true, 5, 0);
 * 
 * Required table schema:
 * - code: text (primary key)
 * - subscription_type: text ('monthly', 'yearly', 'lifetime')
 * - description: text
 * - duration_months: integer (nullable for lifetime)
 * - is_active: boolean
 * - usage_limit: integer (nullable for unlimited)
 * - used_count: integer (default 0)
 * - expires_at: timestamp (nullable)
 * - created_at: timestamp (default now())
 */

/**
 * Validate a referral code and return its details
 * 🔒 BACKEND-ONLY: All codes are validated against the Supabase database
 */
export const validateReferralCode = async (code: string): Promise<{ valid: boolean; referralCode?: ReferralCode; error?: string }> => {
  try {
    const upperCode = code.toUpperCase().trim();
    console.log('🔍 Validating referral code:', upperCode);
    
    // First, let's check if the table exists and we can access it
    const { data: tableCheck, error: tableError } = await supabase
      .from('referral_codes')
      .select('code')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table access error:', tableError);
      return { 
        valid: false, 
        error: `Database error: ${tableError.message}. Please ensure the referral_codes table exists and RLS policies allow access.` 
      };
    }
    
    console.log('✅ Table accessible, found', tableCheck?.length || 0, 'total codes');
    
    // Query database for the specific referral code
    const { data: dbCode, error } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', upperCode)
      .eq('is_active', true)
      .single();

    console.log('🔎 Database query result:', { data: dbCode, error });

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('❌ Database query error:', error);
      return { valid: false, error: `Database error: ${error.message}` };
    }
    
    if (!dbCode) {
      // Let's also check if the code exists but is inactive
      const { data: inactiveCode } = await supabase
        .from('referral_codes')
        .select('code, is_active')
        .eq('code', upperCode)
        .single();
      
      if (inactiveCode) {
        console.log('❌ Code exists but is inactive:', inactiveCode);
        return { valid: false, error: 'This referral code is no longer active' };
      }
      
      console.log('❌ Code not found in database');
      return { valid: false, error: 'Invalid referral code' };
    }
    
    console.log('✅ Found valid code:', dbCode);
    
    // Check usage limits
    if (dbCode.usage_limit && dbCode.used_count >= dbCode.usage_limit) {
      console.log('❌ Usage limit exceeded:', { used: dbCode.used_count, limit: dbCode.usage_limit });
      return { valid: false, error: 'This referral code has reached its usage limit' };
    }
    
    // Check expiration
    if (dbCode.expires_at && new Date() > new Date(dbCode.expires_at)) {
      console.log('❌ Code expired:', dbCode.expires_at);
      return { valid: false, error: 'This referral code has expired' };
    }
    
    console.log('🎉 Code validation successful!');
    return { valid: true, referralCode: dbCode };
  } catch (error) {
    console.error('💥 Unexpected error in validateReferralCode:', error);
    return { valid: false, error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
};

/**
 * Check if user has already used a referral code
 */
export const hasUserUsedReferralCode = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('referral_redemptions')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    
    if (error) {
      console.error('Error checking referral code usage:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Error in hasUserUsedReferralCode:', error);
    return false;
  }
};

/**
 * Redeem a referral code for the current user
 */
export const redeemReferralCode = async (code: string): Promise<{ success: boolean; message: string; subscriptionType?: string }> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, message: 'User not authenticated' };
    }
    
    // Check if user has already used a referral code
    const hasUsedCode = await hasUserUsedReferralCode(user.id);
    if (hasUsedCode) {
      return { success: false, message: 'You have already used a referral code' };
    }
    
    // Validate the code
    const validation = await validateReferralCode(code);
    if (!validation.valid || !validation.referralCode) {
      return { success: false, message: validation.error || 'Invalid referral code' };
    }
    
    const referralCode = validation.referralCode;
    const upperCode = code.toUpperCase().trim();
    
    try {
      // Start a transaction-like operation
      
      // 1. Upgrade user to pro
      await upgradeUserToPro(user.id);
      
      // 2. Record the redemption
      const expiresAt = referralCode.duration_months 
        ? new Date(Date.now() + referralCode.duration_months * 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;
      
      const { error: redemptionError } = await supabase
        .from('referral_redemptions')
        .insert([{
          user_id: user.id,
          referral_code: upperCode,
          subscription_type: referralCode.subscription_type,
          redeemed_at: new Date().toISOString(),
          expires_at: expiresAt
        }]);
      
      if (redemptionError) {
        console.error('Error recording redemption:', redemptionError);
        // Don't fail the entire operation for this
      }
      
      // 3. Update usage count in database
      await supabase
        .from('referral_codes')
        .update({ used_count: referralCode.used_count + 1 })
        .eq('code', upperCode);
      
      // 4. Store subscription info in user table with expiration
      const updateData: any = { 
        is_pro: true,
        referral_subscription_type: referralCode.subscription_type
      };
      
      if (expiresAt && referralCode.subscription_type !== 'lifetime') {
        updateData.pro_expires_at = expiresAt;
      }
      
      await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);
      
      // 5. Store redemption info locally for quick access
      await AsyncStorage.setItem('referral_redemption', JSON.stringify({
        code: upperCode,
        type: referralCode.subscription_type,
        redeemedAt: new Date().toISOString(),
        expiresAt
      }));
      
      let message = '';
      switch (referralCode.subscription_type) {
        case 'monthly':
          message = `🎉 Welcome to Keystone Pro! You now have 1 month of unlimited access. Enjoy all premium features!`;
          break;
        case 'yearly':
          message = `🚀 Amazing! You've unlocked a full year of Keystone Pro! All premium features are now available.`;
          break;
        case 'lifetime':
          message = `💎 Incredible! You now have lifetime access to Keystone Pro! Welcome to the exclusive club.`;
          break;
        default:
          message = `✅ Referral code redeemed successfully! You now have Pro access.`;
      }
      
      return { 
        success: true, 
        message,
        subscriptionType: referralCode.subscription_type 
      };
      
    } catch (error) {
      console.error('Error during redemption process:', error);
      return { success: false, message: 'Failed to process referral code. Please try again.' };
    }
    
  } catch (error) {
    console.error('Error in redeemReferralCode:', error);
    return { success: false, message: 'An error occurred. Please try again.' };
  }
};

/**
 * Get user's referral redemption info
 */
export const getUserReferralInfo = async (): Promise<ReferralRedemption | null> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('referral_redemptions')
      .select('*')
      .eq('user_id', user.id)
      .order('redeemed_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error getting referral info:', error);
      return null;
    }
    
    return data || null;
  } catch (error) {
    console.error('Error in getUserReferralInfo:', error);
    return null;
  }
};

/**
 * Check if user's referral subscription has expired
 */
export const checkReferralExpiration = async (): Promise<{ expired: boolean; expiresAt?: string }> => {
  try {
    const referralInfo = await getUserReferralInfo();
    if (!referralInfo || !referralInfo.expires_at) {
      return { expired: false };
    }
    
    const now = new Date();
    const expiresAt = new Date(referralInfo.expires_at);
    const expired = now > expiresAt;
    
    if (expired && referralInfo.subscription_type !== 'lifetime') {
      // Downgrade user if their referral subscription expired
      await downgradeUserToFree();
    }
    
    return { expired, expiresAt: referralInfo.expires_at };
  } catch (error) {
    console.error('Error checking referral expiration:', error);
    return { expired: false };
  }
};

/**
 * Get available referral codes for testing/admin purposes
 * 🔒 BACKEND-ONLY: Fetches active codes from the database
 */
export const getAvailableReferralCodes = async (): Promise<string[]> => {
  try {
    const { data: codes, error } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching referral codes:', error);
      return [];
    }
    
    return codes.map(code => code.code);
  } catch (error) {
    console.error('Error in getAvailableReferralCodes:', error);
    return [];
  }
};

/**
 * 🐛 DEBUG FUNCTION: Test referral code database connection
 * Use this to troubleshoot referral code validation issues
 */
export const debugReferralDatabase = async (): Promise<void> => {
  console.log('🐛 Starting referral database debug...');
  
  try {
    // Test 1: Check if table exists
    console.log('📝 Test 1: Checking table access...');
    const { data: allCodes, error: tableError } = await supabase
      .from('referral_codes')
      .select('*');
    
    if (tableError) {
      console.error('❌ Table access failed:', tableError);
      return;
    }
    
    console.log('✅ Table accessible! Found codes:', allCodes?.length || 0);
    
    // Test 2: Show all codes in database
    if (allCodes && allCodes.length > 0) {
      console.log('📋 All codes in database:');
      allCodes.forEach(code => {
        console.log(`  - ${code.code} (${code.subscription_type}, active: ${code.is_active}, used: ${code.used_count}/${code.usage_limit || 'unlimited'})`);
      });
    } else {
      console.log('⚠️ No referral codes found in database!');
      console.log('💡 Run the setup SQL script: database/setup_referral_codes.sql');
    }
    
    // Test 3: Test validation with existing codes
    if (allCodes && allCodes.length > 0) {
      const testCode = allCodes[0].code;
      console.log(`🧪 Test 3: Testing validation with code: ${testCode}`);
      const validation = await validateReferralCode(testCode);
      console.log('🧪 Validation result:', validation);
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error);
  }
};

/**
 * Called when the app is opened via a referral deep link (?ref=CODE), before the user
 * has an account. Validates the code and stores it exactly the way the onboarding
 * ReferralCode screen does, so the existing pending_referral_code flow (applied in
 * services/auth/auth.ts after signup) picks it up regardless of how the code arrived.
 */
export const trackReferralDownload = async (code: string): Promise<void> => {
  try {
    const validation = await validateReferralCode(code);
    if (!validation.valid || !validation.referralCode) {
      console.log('Referral deep link code is invalid, ignoring:', code, validation.error);
      return;
    }

    const referralInfo = {
      code: code.toUpperCase().trim(),
      subscriptionType: validation.referralCode.subscription_type,
      description: validation.referralCode.description,
      durationMonths: validation.referralCode.duration_months,
      redeemedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem('pending_referral_code', JSON.stringify(referralInfo));
    console.log('Referral code from deep link saved for onboarding:', referralInfo);
  } catch (error) {
    console.error('Error tracking referral download:', error);
  }
};

// getUserSubscriptionDetails moved to services/subscription/subscriptionService.ts
// (it wasn't referral-specific -- it belongs with the rest of the pro-status logic).