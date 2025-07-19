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
    const msg = error?.message?.toLowerCase() || '';
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
    const msg = error?.message?.toLowerCase() || '';
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
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) throw error;
  return true;
};

export const insertUserProfileAfterConfirmation = async (
  preferences: Preferences
) => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw userError;

  const userId = user.id;

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

  if (!user) {
    // No active session, route to sign-up screen
    return { status: 'no_session' };
  }

  // Check if user's email is confirmed
  const emailConfirmed = user.email_confirmed_at !== null;
  
  if (!emailConfirmed) {
    // User signed up but hasn't confirmed email yet
    // This should be handled in the registration flow, not here
    // If we get here, something went wrong, so sign them out and start fresh
    await supabase.auth.signOut();
    return { status: 'no_session' };
  }

  // Check database for user profile and onboarding status
  const { data, error } = await supabase
    .from('users')
    .select('onboarding_complete')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching onboarding status:', error);
    return { status: 'error' };
  }

  console.log('User database record:', data);

  if (!data) {
    // User is signed in and email confirmed, but no database record exists
    // This means they need to start onboarding from the beginning
    // Clear any stale onboarding data
    await clearOnboardingData();
    return { status: 'needs_onboarding' };
  }

  // Update local storage with current database state
  await AsyncStorage.setItem('onboarding_complete', data.onboarding_complete ? 'true' : 'false');

  return data.onboarding_complete
    ? { status: 'complete' }
    : { status: 'incomplete' };
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
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('User not authenticated, returning false for pro status');
      return false; // Return false instead of throwing
    }

    const { data, error } = await supabase
      .from('users')
      .select('is_pro')
      .eq('id', user.id)
      .maybeSingle(); // Use maybeSingle instead of single

    if (error) {
      console.error('Error checking pro status:', error);
      return false; // Return false on error instead of throwing
    }

    if (!data) {
      console.log('User record not found, returning false for pro status');
      return false;
    }

    return data?.is_pro || false;
  } catch (error) {
    console.error('Error in checkUserProStatus:', error);
    return false;
  }
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
    ]);
    console.log('Onboarding data cleared successfully');
  } catch (error) {
    console.error('Error clearing onboarding data:', error);
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