import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addIdentityKeysBatch, IdentityKey } from '../user/userKeys';
import { handleNewUserEmailList } from '../integrations/emailListService';
import { redeemReferralCode } from '../user/referralService';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { BASE_URL } from '../../lib/apiConfig';
import { queryClient } from '../../lib/queryClient';
import { getAuthHeaders } from '../features/affirmationService';

// Lazy load Google Sign In to avoid crashes during development
let GoogleSignin: any = null;
try {
  const googleSigninModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleSigninModule.GoogleSignin;

  // Configure Google Sign In
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
    offlineAccess: true,
  });
} catch (error) {
  console.warn('Google Sign In module not available - rebuild app to enable');
}

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
        emailRedirectTo: 'https://thekeystoneapp.com/verify', // Landing page hands off to keystone://emailconfirmation
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

export const signInWithGoogle = async () => {
  try {
    if (!GoogleSignin) {
      throw new Error('Google Sign In not available. Please rebuild the app with: npx expo run:ios');
    }

    console.log('Starting native Google Sign-In...');

    // Check if Google Play Services are available
    await GoogleSignin.hasPlayServices();

    // Sign in with Google
    const response = await GoogleSignin.signIn();
    console.log('Google sign-in response:', JSON.stringify(response, null, 2));

    // Get the ID token - handle both old and new response formats
    const idToken = response?.data?.idToken || response?.idToken;
    const user = response?.data?.user || response?.user;

    console.log('Google user info received:', user);

    if (!idToken) {
      console.error('No idToken in response. Full response:', response);
      throw new Error('No ID token received from Google. Make sure webClientId is configured correctly.');
    }

    // Get access token if available
    const tokens = await GoogleSignin.getTokens();
    console.log('Google tokens:', { hasAccessToken: !!tokens?.accessToken, hasIdToken: !!tokens?.idToken });

    console.log('Signing in to Supabase with Google ID token...');

    // Sign in to Supabase with the Google ID token
    // Use the idToken from getTokens() if available, otherwise use the one from signIn response
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: tokens?.idToken || idToken,
      access_token: tokens?.accessToken,
    });

    if (error) {
      console.error('Supabase Google sign-in error:', error);

      // Handle specific Supabase errors
      if (error.message?.includes('nonce')) {
        throw new Error('Authentication configuration error. Please try again or use email sign-in.');
      } else if (error.message?.includes('Invalid token')) {
        throw new Error('Google authentication failed. Please try again.');
      } else if (error.message?.includes('User not found')) {
        throw new Error('Account not found. Please register first.');
      }

      throw error;
    }

    if (!data.user) {
      throw new Error('Sign in succeeded but no user returned');
    }

    console.log('Successfully signed in with Google:', data.user?.id);

    // Check if user profile exists, if not create it
    const profileExists = await checkUserProfileExists();
    if (!profileExists) {
      console.log('Creating profile for new Google user...');
      // Get preferences from AsyncStorage or use defaults
      const savedPrefs = await AsyncStorage.getItem('final_preferences');
      const preferences = savedPrefs ? JSON.parse(savedPrefs) : {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notification_opt_in: true,
        preferred_reminder_time: '12:00:00',
        preferred_ai_persona: 'Gentle Guide',
      };
      await insertUserProfileAfterConfirmation(preferences);
    }

    return data.user;
  } catch (error: any) {
    console.error('Error in signInWithGoogle:', error);

    // Handle specific Google Sign-In errors
    if (error.code === 'SIGN_IN_CANCELLED' || error.message?.includes('cancelled')) {
      throw new Error('Sign in cancelled by user');
    } else if (error.code === 'IN_PROGRESS') {
      throw new Error('Sign in already in progress');
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      throw new Error('Google Play Services not available');
    }

    throw error;
  }
};

export const signInWithApple = async () => {
  try {
    // Check if Apple Authentication is available
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign In is only available on iOS');
    }

    const isAvailable = await AppleAuthentication.isAvailableAsync();

    if (!isAvailable) {
      throw new Error('Apple Sign In is not available on this device');
    }

    console.log('Starting native Apple Sign-In...');

    // Request Apple authentication
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    console.log('Apple credential received');

    // Get the identity token
    const { identityToken } = credential;

    if (!identityToken) {
      throw new Error('No identity token received from Apple');
    }

    console.log('Signing in to Supabase with Apple ID token...');

    // Sign in to Supabase with the Apple ID token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: identityToken,
    });

    if (error) {
      console.error('Supabase Apple sign-in error:', error);
      throw error;
    }

    // If this is the user's first sign-in, save their name
    if (credential.fullName && (credential.fullName.givenName || credential.fullName.familyName)) {
      const fullName = `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim();
      if (fullName) {
        await AsyncStorage.setItem('@user_name', fullName);
        console.log('Saved Apple user name:', fullName);
      }
    }

    console.log('Successfully signed in with Apple:', data.user?.id);

    // Check if user profile exists, if not create it
    const profileExists = await checkUserProfileExists();
    if (!profileExists) {
      console.log('Creating profile for new Apple user...');
      // Get preferences from AsyncStorage or use defaults
      const savedPrefs = await AsyncStorage.getItem('final_preferences');
      const preferences = savedPrefs ? JSON.parse(savedPrefs) : {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notification_opt_in: true,
        preferred_reminder_time: '12:00:00',
        preferred_ai_persona: 'Gentle Guide',
      };
      await insertUserProfileAfterConfirmation(preferences);
    }

    return data.user;
  } catch (error: any) {
    console.error('Error in signInWithApple:', error);

    // Handle Apple Sign-In specific errors
    if (error.code === 'ERR_CANCELED' || error.message?.includes('cancelled')) {
      throw new Error('Sign in cancelled by user');
    }

    throw error;
  }
};

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://thekeystoneapp.com/verify', // Landing page hands off to keystone://resetpassword
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

  // Get user name from AsyncStorage
  let userName = '';
  try {
    userName = await AsyncStorage.getItem('@user_name') || '';
    console.log('Retrieved user name from AsyncStorage:', userName);
  } catch (error) {
    console.error('Error retrieving user name from AsyncStorage:', error);
  }

  console.log('Inserting user profile:', { userId, email: user.email, name: userName });

  // Insert into users table
  console.log('insertUserProfileAfterConfirmation - Inserting user profile with onboarding_complete: true');
  const { error: userInsertError } = await supabase.from('users').insert([
    {
      id: userId,
      email: user.email,
      name: userName.trim() || null, // Use null if name is empty
      is_pro: false,
      onboarding_complete: true,
    },
  ]);

  if (userInsertError) {
    console.error('Error inserting user profile:', userInsertError);
    throw userInsertError;
  }
  
  console.log('insertUserProfileAfterConfirmation - User profile inserted successfully');

  // Add user to Resend email list (non-blocking)
  if (user.email) {
    // Use setTimeout to make this non-blocking
    setTimeout(async () => {
      try {
        await handleNewUserEmailList({ sendWelcome: true });
      } catch (resendError) {
        console.error('Error adding user to Resend email list:', resendError);
        // Don't throw the error here - we don't want to fail user creation if email list fails
        // You might want to log this to your error tracking service
      }
    }, 100); // Small delay to ensure user creation completes first
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

  // Handle pending referral code if user staged one during onboarding. Redemption
  // (validation, usage-limit/expiry checks, users/referral_redemptions writes) is
  // owned entirely by referralService.redeemReferralCode() -- re-validating live
  // here instead of trusting the AsyncStorage snapshot from onboarding time.
  try {
    console.log('Checking for pending referral code...');
    const pendingReferralCode = await AsyncStorage.getItem('pending_referral_code');

    if (pendingReferralCode) {
      const { code } = JSON.parse(pendingReferralCode);
      const result = await redeemReferralCode(code);
      console.log('Referral redemption result post-registration:', result);
      await AsyncStorage.removeItem('pending_referral_code');
    }
  } catch (referralError) {
    console.error('Error handling pending referral code:', referralError);
    // Don't throw - non-critical error
  }

  // IAP-to-Superwall migration is handled once per session by
  // services/subscription/subscriptionService.ts's migrateFromIAPToSuperwall(),
  // called from SuperwallContext's user-init effect -- this used to be duplicated here.

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

// Holds the id of the user whose completed onboarding was last confirmed by the database
const ONBOARDING_VERIFIED_KEY = 'onboarding_verified_user_id';

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

  // Returning users who were already confirmed complete skip the network wait: the splash
  // would otherwise sit on a database round trip on every launch. It is re-verified in the
  // background, and a mismatch clears the shortcut for the next launch.
  if ((await AsyncStorage.getItem(ONBOARDING_VERIFIED_KEY)) === user.id) {
    (async () => {
      try {
        const { data: latest, error: latestError } = await supabase
          .from('users')
          .select('onboarding_complete')
          .eq('id', user.id)
          .maybeSingle();
        if (!latestError && !latest?.onboarding_complete) {
          await AsyncStorage.removeItem(ONBOARDING_VERIFIED_KEY);
        }
      } catch (e) {
        console.error('Background onboarding re-check failed:', e);
      }
    })();
    return { status: 'complete' };
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
  const hasUserInfo = await AsyncStorage.getItem('@user_name');
  const hasQuizAnswers = await AsyncStorage.getItem('quiz_answers');
  const hasFutureSelf = await AsyncStorage.getItem('future_self_vision');
  const hasLifeGoals = await AsyncStorage.getItem('life_goals');
  const hasCoreValues = await AsyncStorage.getItem('core_values');

  console.log('checkUserStatus - AsyncStorage onboarding state:', {
    onboardingComplete,
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
    await AsyncStorage.setItem(ONBOARDING_VERIFIED_KEY, user.id);
    console.log('checkUserStatus - Onboarding complete in database, returning complete');
    return { status: 'complete' };
  }

  // Check for user info completion (quiz + user info)
  if (hasUserInfo && hasQuizAnswers) {
    // Check if user has completed referral code step
    const hasReferralCode = await AsyncStorage.getItem('referral_code_complete');
    if (hasReferralCode === 'true') {
      // User has completed referral code step, mark onboarding complete
      console.log('checkUserStatus - Has user info and quiz, referral complete, marking onboarding complete');
      await AsyncStorage.setItem('onboarding_complete', 'true');
      return { status: 'complete' };
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

// checkUserProStatus, upgradeUserToPro, downgradeUserToFree moved to
// services/subscription/subscriptionService.ts (consolidated with the other
// pro-status logic that used to be scattered across this file, referralService.ts,
// and superwallService.ts).

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

// Check if subscription is complete
export const isSubscriptionComplete = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_pro')
      .eq('id', user.id)
      .single();

    return userData?.is_pro || false;
  } catch (error) {
    console.error('Error checking subscription completion:', error);
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

// Deletion happens on the server: it clears every table that holds the user's data (including ones
// the client has no permission to reach), removes the mailing-list contact, then deletes the auth
// user last. Any failure comes back as a thrown error and leaves the account intact so the user can
// retry; nothing local is wiped until the server confirms.
export const deleteUserAccount = async (): Promise<boolean> => {
  const response = await fetch(`${BASE_URL}/account/delete`, {
    method: 'POST',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Account deletion failed (${response.status})`);
  }

  // The account is already gone, so local cleanup is best-effort and must never turn into an error
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (notificationError) {
    console.warn('Could not cancel scheduled notifications after account deletion');
  }

  try {
    // The server session no longer exists, so a network sign-out would only fail
    await supabase.auth.signOut({ scope: 'local' });
    queryClient.clear();
    await AsyncStorage.clear();
  } catch (cleanupError) {
    console.warn('Could not fully clear local data after account deletion');
  }

  return true;
};