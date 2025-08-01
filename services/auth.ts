import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addIdentityKeysBatch, IdentityKey } from './userKeys';
import { handleNewUserEmailList } from './emailListService';
import { createFirstReminder } from './reminderService';

interface Preferences {
  timezone?: string;
  notification_opt_in?: boolean;
  preferred_reminder_time?: string;
  preferred_ai_persona?: string;
}

export const signUpUser = async (email: string, password: string) => {
  try {
    console.log('Starting signup process for:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'keystone://emailconfirmation', // Deep link back to app
      },
    });

    if (error) {
      // Only log unexpected errors
      const msg = error?.message?.toLowerCase() || '';
      if (
        msg.includes('password should be at least 8 characters') ||
        msg.includes('anonymous sign-ins are disabled') ||
        msg.includes('invalid')
      ) {
        // Do not log known user input errors
        throw error;
      } else {
        console.error('Signup error:', error);
        throw error;
      }
    }
    
    console.log('Signup response:', {
      user: data.user?.id,
      session: !!data.session,
      emailConfirmed: data.user?.email_confirmed_at,
    });
    
    if (!data.user) {
      throw new Error('Signup succeeded but no user returned');
    }
    
    // When email confirmation is required, no session is created until email is confirmed
    // This is expected behavior
    console.log('Signup successful - user created, waiting for email confirmation');
    return data.user;
  } catch (error) {
    // Only log unexpected errors
    const msg = (error as any)?.message?.toLowerCase() || '';
    if (
      msg.includes('password should be at least 8 characters') ||
      msg.includes('anonymous sign-ins are disabled') ||
      msg.includes('invalid')
    ) {
      // Do not log known user input errors
      throw error;
    } else {
      console.error('Error in signUpUser:', error);
      throw error;
    }
  }
};

export const signInUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const msg = error?.message?.toLowerCase() || '';
      if (msg.includes('missing email or phone')) {
        // Do not log known user input errors
        throw error;
      } else {
        console.error('Sign-in error:', error);
        throw error;
      }
    }

    const user = data.user;
    if (!user) {
      throw new Error('Sign-in succeeded but no user returned.');
    }

    console.log('Sign-in successful for user:', user.id);
    return user;
  } catch (error) {
    const msg = (error as any)?.message?.toLowerCase() || '';
    if (msg.includes('missing email or phone')) {
      // Do not log known user input errors
      throw error;
    } else {
      console.error('Error in signInUser:', error);
      throw error;
    }
  }
};

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'keystone://resetpassword',
  });

  if (error) throw error;
  return true;
};

export const insertUserProfileAfterConfirmation = async (
  preferences: Preferences
) => {
  console.log('insertUserProfileAfterConfirmation - Starting with preferences:', preferences);
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('insertUserProfileAfterConfirmation - User error:', userError);
    throw userError;
  }

  const userId = user.id;
  console.log('insertUserProfileAfterConfirmation - User ID:', userId);

  // Check if user profile already exists
  const { data: existingProfile, error: profileCheckError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (profileCheckError) throw profileCheckError;

  if (existingProfile) {
    console.log('User profile already exists, skipping insert.');
    return true;
  }

  console.log('Inserting user profile:', { userId, email: user.email });

  // Insert into users table
  console.log('insertUserProfileAfterConfirmation - Inserting user profile with onboarding_complete: true');
  const { error: userInsertError } = await supabase.from('users').insert([
    {
      id: userId,
      email: user.email,
      is_pro: false,
      onboarding_complete: true,
    },
  ]);

  if (userInsertError) {
    console.error('Error inserting user profile:', userInsertError);
    throw userInsertError;
  }
  
  console.log('insertUserProfileAfterConfirmation - User profile inserted successfully');

  // Add user to Resend email list
  try {
    if (user.email) {
      console.log('Adding user to Resend email list:', user.email);
      await handleNewUserEmailList({
        email: user.email,
        sendWelcome: true,
      });
    }
  } catch (resendError) {
    console.error('Error adding user to Resend email list:', resendError);
    // Don't throw the error here - we don't want to fail user creation if email list fails
    // You might want to log this to your error tracking service
  }

  // Use provided preferences or fallback to defaults
  const userPreferences = {
    user_id: userId,
    timezone: preferences.timezone || 'UTC',
    notification_opt_in: preferences.notification_opt_in ?? true,
    preferred_reminder_time: preferences.preferred_reminder_time || '09:00:00',
    preferred_ai_persona: preferences.preferred_ai_persona || 'gentle',
  };

  console.log('Inserting user preferences:', userPreferences);

  const { error: prefInsertError } = await supabase.from('user_preferences').insert([userPreferences]);

  if (prefInsertError) {
    console.error('Error inserting user preferences:', prefInsertError);
    throw prefInsertError;
  }

  // Create first reminder
  try {
    console.log('Creating first reminder for user...');
    await createFirstReminder();
  } catch (reminderError) {
    console.error('Error creating first reminder:', reminderError);
    // Don't throw - non-critical error
  }

  // Handle pending referral code if user redeemed one during onboarding
  try {
    console.log('Checking for pending referral code...');
    const pendingReferralCode = await AsyncStorage.getItem('pending_referral_code');
    
    if (pendingReferralCode) {
      const referralInfo = JSON.parse(pendingReferralCode);
      console.log('Found pending referral code:', referralInfo);
      
      // Apply the referral code benefits
      const expiresAt = referralInfo.durationMonths 
        ? new Date(Date.now() + referralInfo.durationMonths * 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;
      
      // Update user with referral subscription info
      const updateData: any = { 
        is_pro: true,
        referral_subscription_type: referralInfo.subscriptionType
      };
      
      if (expiresAt && referralInfo.subscriptionType !== 'lifetime') {
        updateData.pro_expires_at = expiresAt;
      }
      
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error updating user with referral subscription:', updateError);
      } else {
        console.log('Successfully applied referral code benefits to user');
        
        // Record the redemption
        const { error: redemptionError } = await supabase
          .from('referral_redemptions')
          .insert([{
            user_id: userId,
            referral_code: referralInfo.code,
            subscription_type: referralInfo.subscriptionType,
            redeemed_at: referralInfo.redeemedAt,
            expires_at: expiresAt
          }]);
        
        if (redemptionError) {
          console.error('Error recording referral redemption:', redemptionError);
        } else {
          console.log('Successfully recorded referral redemption');
        }
        
        // Update usage count in referral_codes table
        const { data: currentCode } = await supabase
          .from('referral_codes')
          .select('used_count')
          .eq('code', referralInfo.code)
          .single();
        
        if (currentCode) {
          await supabase
            .from('referral_codes')
            .update({ used_count: currentCode.used_count + 1 })
            .eq('code', referralInfo.code);
        }
      }
      
      // Clear the pending referral code
      await AsyncStorage.removeItem('pending_referral_code');
    }
  } catch (referralError) {
    console.error('Error handling pending referral code:', referralError);
    // Don't throw - non-critical error
  }

  // Handle pending alignment scores from quiz
  try {
    console.log('Checking for pending alignment scores from quiz...');
    const pendingAlignmentScores = await AsyncStorage.getItem('pending_alignment_scores');
    
    if (pendingAlignmentScores) {
      const alignmentScores = JSON.parse(pendingAlignmentScores);
      console.log('Found pending alignment scores:', alignmentScores);
      
      // Update user with alignment scores
      const { error: alignmentError } = await supabase
        .from('users')
        .update({
          core_values: alignmentScores.core_values,
          identity_traits: alignmentScores.identity_traits,
          future_self_vision: alignmentScores.future_self_vision,
          avoidances: alignmentScores.avoidances,
          motivations: alignmentScores.motivations,
          life_goals: alignmentScores.life_goals
        })
        .eq('id', userId);
      
      if (alignmentError) {
        console.error('Error updating user with alignment scores:', alignmentError);
      } else {
        console.log('Successfully transferred alignment scores to database');
      }
      
      // Clear the pending alignment scores
      await AsyncStorage.removeItem('pending_alignment_scores');
    }
  } catch (alignmentError) {
    console.error('Error handling pending alignment scores:', alignmentError);
    // Don't throw - non-critical error
  }

  // Get identity keys from AsyncStorage
  try {
    console.log('Loading identity keys from AsyncStorage...');
    
    // Add a small delay to ensure AsyncStorage operations are complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const futureSelfVision = await AsyncStorage.getItem('future_self_vision');
    const lifeGoals = await AsyncStorage.getItem('life_goals');
    const coreValues = await AsyncStorage.getItem('core_values');
    
    console.log('Raw AsyncStorage data:', {
      futureSelfVision,
      lifeGoals,
      coreValues,
    });
    
    // Get custom options for each category
    const futureSelfCustom = await AsyncStorage.getItem('futureselfvision_custom_options');
    const lifeGoalsCustom = await AsyncStorage.getItem('lifegoals_custom_options');
    const coreValuesCustom = await AsyncStorage.getItem('corevalues_custom_options');

    console.log('Custom options:', {
      futureSelfCustom,
      lifeGoalsCustom,
      coreValuesCustom,
    });

    const identityKeys: IdentityKey[] = [];

    if (futureSelfVision) {
      const visions = JSON.parse(futureSelfVision);
      visions.forEach((vision: string) => {
        identityKeys.push({
          category: 'future_self_vision',
          description: vision,
        });
      });
    }

    // Add custom future self visions
    if (futureSelfCustom) {
      const customVisions = JSON.parse(futureSelfCustom);
      customVisions.forEach((vision: string) => {
        identityKeys.push({
          category: 'future_self_vision',
          description: vision,
        });
      });
    }

    if (lifeGoals) {
      const goals = JSON.parse(lifeGoals);
      goals.forEach((goal: string) => {
        identityKeys.push({
          category: 'life_goals',
          description: goal,
        });
      });
    }

    // Add custom life goals
    if (lifeGoalsCustom) {
      const customGoals = JSON.parse(lifeGoalsCustom);
      customGoals.forEach((goal: string) => {
        identityKeys.push({
          category: 'life_goals',
          description: goal,
        });
      });
    }

    if (coreValues) {
      const values = JSON.parse(coreValues);
      values.forEach((value: string) => {
        identityKeys.push({
          category: 'core_values',
          description: value,
        });
      });
    }

    // Add custom core values
    if (coreValuesCustom) {
      const customValues = JSON.parse(coreValuesCustom);
      customValues.forEach((value: string) => {
        identityKeys.push({
          category: 'core_values',
          description: value,
        });
      });
    }

    if (identityKeys.length > 0) {
      console.log('Inserting identity keys:', identityKeys);
      console.log('Number of keys to insert:', identityKeys.length);
      await addIdentityKeysBatch(identityKeys);
      console.log('Identity keys inserted successfully');
    } else {
      console.log('No identity keys to insert - this might be the issue!');
      console.log('Raw data check:', {
        futureSelfVision: !!futureSelfVision,
        lifeGoals: !!lifeGoals,
        coreValues: !!coreValues,
        futureSelfCustom: !!futureSelfCustom,
        lifeGoalsCustom: !!lifeGoalsCustom,
        coreValuesCustom: !!coreValuesCustom,
      });
    }

    // Clean up AsyncStorage - include all the new keys
    await AsyncStorage.multiRemove([
      'future_self_vision',
      'life_goals',
      'core_values',
      'futureselfvision_custom_options',
      'lifegoals_custom_options',
      'corevalues_custom_options',
    ]);

  } catch (error) {
    console.error('Error inserting identity keys:', error);
    throw error;
  }

  // Verify the user profile was created correctly
  const { data: verifyData, error: verifyError } = await supabase
    .from('users')
    .select('id, onboarding_complete')
    .eq('id', userId)
    .single();
    
  if (verifyError) {
    console.error('Error verifying user profile creation:', verifyError);
  } else {
    console.log('insertUserProfileAfterConfirmation - Verification successful:', verifyData);
  }

  return true;
};

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
  } else {
    console.log('User signed out successfully');
  }
  
  // Clear any auth-related storage
  try {
    await AsyncStorage.multiRemove([
      'onboarding_complete',
      'user_preferences',
      'final_preferences'
    ]);
  } catch (storageError) {
    console.error('Error clearing auth storage:', storageError);
  }
};

export const clearAuthState = async () => {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear all AsyncStorage
    await AsyncStorage.clear();
    
    // Force clear any auth-related storage keys specifically
    await AsyncStorage.multiRemove([
      'supabase.auth.token',
      'sb-supabase-auth-token',
      'supabase.session',
      'onboarding_complete',
      'user_preferences',
      'final_preferences',
      'notificationPermissionShown'
    ]);
    
    console.log('Auth state cleared successfully');
  } catch (error) {
    console.error('Error clearing auth state:', error);
  }
};

export const initializeAuth = async () => {
  try {
    // Clear any existing auth state first
    await clearAuthState();
    
    // Initialize fresh auth state
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error initializing auth:', error);
      return false;
    }
    
    console.log('Auth initialized successfully', session ? 'with session' : 'without session');
    return true;
  } catch (error) {
    console.error('Error in initializeAuth:', error);
    return false;
  }
};

export const debugAuthState = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('=== AUTH DEBUG ===');
    console.log('Session:', session);
    console.log('Error:', error);
    console.log('User:', session?.user);
    console.log('Access Token:', session?.access_token ? 'Present' : 'Missing');
    console.log('Refresh Token:', session?.refresh_token ? 'Present' : 'Missing');
    console.log('==================');
    
    // Check AsyncStorage keys
    const keys = await AsyncStorage.getAllKeys();
    const authKeys = keys.filter(key => 
      key.includes('auth') || 
      key.includes('supabase') || 
      key.includes('token') ||
      key.includes('session')
    );
    console.log('Auth-related AsyncStorage keys:', authKeys);
    
    return { session, error };
  } catch (error) {
    console.error('Error in debugAuthState:', error);
    return { session: null, error };
  }
};

export const checkUserStatus = async () => {
  // Check for active session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  console.log('checkUserStatus - Session user:', user ? { id: user.id, email: user.email, emailConfirmed: user.email_confirmed_at } : 'No user');

  if (!user) {
    // No active session, route to sign-in screen
    console.log('checkUserStatus - No session, returning no_session');
    return { status: 'no_session' };
  }

  // Check if user's email is confirmed
  const emailConfirmed = user.email_confirmed_at !== null;
  
  console.log('checkUserStatus - Email confirmed:', emailConfirmed);
  
  if (!emailConfirmed) {
    // User signed up but hasn't confirmed email yet
    // Route to registration flow
    console.log('checkUserStatus - Email not confirmed, returning needs_email_confirmation');
    return { status: 'needs_email_confirmation' };
  }

  // Check database for user profile and onboarding status
  const { data, error } = await supabase
    .from('users')
    .select('onboarding_complete, is_pro')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user status:', error);
    return { status: 'error' };
  }

  console.log('checkUserStatus - User database record:', data);

  if (!data) {
    // User is signed in and email confirmed, but no database record exists
    // This means they need to start onboarding from the beginning
    // Clear any stale onboarding data
    console.log('checkUserStatus - No database record, clearing onboarding data and returning needs_onboarding');
    await clearOnboardingData();
    return { status: 'needs_onboarding' };
  }

  // Check AsyncStorage for onboarding progress
  const onboardingComplete = await AsyncStorage.getItem('onboarding_complete');
  const hasSubscription = await AsyncStorage.getItem('subscription_complete');
  const hasUserInfo = await AsyncStorage.getItem('@user_name');
  const hasQuizAnswers = await AsyncStorage.getItem('quiz_answers');
  const hasFutureSelf = await AsyncStorage.getItem('future_self_vision');
  const hasLifeGoals = await AsyncStorage.getItem('life_goals');
  const hasCoreValues = await AsyncStorage.getItem('core_values');

  console.log('checkUserStatus - AsyncStorage onboarding state:', {
    onboardingComplete,
    hasSubscription,
    hasUserInfo,
    hasQuizAnswers,
    hasFutureSelf,
    hasLifeGoals,
    hasCoreValues
  });

  // Update local storage with current database state
  await AsyncStorage.setItem('onboarding_complete', data.onboarding_complete ? 'true' : 'false');

  console.log('checkUserStatus - Database onboarding_complete:', data.onboarding_complete);

  // If user has completed onboarding in database, they're done
  if (data.onboarding_complete) {
    console.log('checkUserStatus - Onboarding complete in database, returning complete');
    return { status: 'complete' };
  }

  // Check for subscription completion
  if (hasSubscription === 'true') {
    // User has subscribed but onboarding not marked complete in database
    // This shouldn't happen normally, but route to subscription page to be safe
    console.log('checkUserStatus - Has subscription but not complete in DB, returning subscription_complete');
    return { status: 'subscription_complete' };
  }

  // Check for user info completion (quiz + user info)
  if (hasUserInfo && hasQuizAnswers) {
    // Check if user has completed referral code step
    const hasReferralCode = await AsyncStorage.getItem('referral_code_complete');
    if (hasReferralCode === 'true') {
      // User has completed referral code step, route to subscription
      console.log('checkUserStatus - Has user info and quiz, referral complete, returning ready_for_subscription');
      return { status: 'ready_for_subscription' };
    } else {
      // User has completed quiz and user info, route to referral code step
      console.log('checkUserStatus - Has user info and quiz, needs referral, returning needs_referral_code');
      return { status: 'needs_referral_code' };
    }
  }

  // Check for quiz completion
  if (hasQuizAnswers) {
    // User has completed quiz but not user info
    console.log('checkUserStatus - Has quiz answers, returning needs_user_info');
    return { status: 'needs_user_info' };
  }

  // Check for identity keys completion
  if (hasFutureSelf || hasLifeGoals || hasCoreValues) {
    // User has started identity keys but not completed quiz
    console.log('checkUserStatus - Has identity keys, returning needs_quiz');
    return { status: 'needs_quiz' };
  }

  // User is signed in but hasn't started onboarding
  console.log('checkUserStatus - No onboarding progress, returning needs_onboarding');
  return { status: 'needs_onboarding' };
};

export const resendConfirmationEmail = async (email: string) => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) throw error;
  return true;
};

export const checkUserProStatus = async () => {
  // 🔒 PAID-ONLY APP: All users are considered "Pro" by default
  // This function now always returns true since the app is behind a hard paywall
  return true;
};

export const upgradeUserToPro = async (userId?: string) => {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const targetUserId = userId || user.id;

    // Update user to pro status in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_pro: true })
      .eq('id', targetUserId);

    if (updateError) {
      throw updateError;
    }

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
    } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const targetUserId = userId || user.id;

    // Update user to free status in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_pro: false })
      .eq('id', targetUserId);

    if (updateError) {
      throw updateError;
    }

    console.log('Successfully downgraded user to free:', targetUserId);
    return true;
  } catch (error) {
    console.error('Error downgrading user to free:', error);
    throw error;
  }
};

export const checkUserProfileExists = async (): Promise<boolean> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('User not authenticated, profile does not exist');
      return false;
    }

    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error checking user profile:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in checkUserProfileExists:', error);
    return false;
  }
};

export const checkEmailExists = async (email: string): Promise<boolean> => {
  // Check in public.users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (userError) {
    console.error('Error checking if email exists in users table:', userError);
  }
  if (userData) return true;

  return false;
};

export const clearOnboardingData = async () => {
  try {
    console.log('Clearing onboarding data from AsyncStorage...');
    await AsyncStorage.multiRemove([
      'onboarding_complete',
      'final_preferences',
      'user_preferences',
      'tempPassword',
      'future_self_vision',
      'life_goals',
      'core_values',
      'ai_personality',
      'futureselfvision_custom_options',
      'lifegoals_custom_options',
      'corevalues_custom_options',
      'aipersonality_custom_options',
      'subscription_complete',
      'referral_code_complete',
      'pending_referral_code',
      'pending_alignment_scores',
      'quiz_answers',
      '@user_name',
      '@user_age',
    ]);
    console.log('Onboarding data cleared successfully');
  } catch (error) {
    console.error('Error clearing onboarding data:', error);
  }
};

// Mark subscription as complete
export const markSubscriptionComplete = async () => {
  try {
    await AsyncStorage.setItem('subscription_complete', 'true');
    console.log('Subscription marked as complete');
    return true;
  } catch (error) {
    console.error('Error marking subscription complete:', error);
    return false;
  }
};

// Check if subscription is complete
export const isSubscriptionComplete = async (): Promise<boolean> => {
  try {
    const subscriptionComplete = await AsyncStorage.getItem('subscription_complete');
    return subscriptionComplete === 'true';
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
};

export const updateUserPassword = async (newPassword: string) => {
  try {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.error('Error updating password:', error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error in updateUserPassword:', error);
    throw error;
  }
};