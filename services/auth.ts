import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Preferences {
  timezone?: string;
  notification_opt_in?: boolean;
  preferred_reminder_time?: string;
  preferred_ai_persona?: string;
}

export const signUpUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // options: {
    //   emailRedirectTo: 'keystone-app://onboarding/SignUp', // for deep linking (optional)
    // },
  });

  if (error) throw error;
  return data.user;
};

export const signInUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log('Sign-in session:', data.session);

  if (error) throw error;

  const user = data.user;
  if (!user) throw new Error('Sign-in succeeded but no user returned.');

  return user;
};

export const insertUserProfileAfterConfirmation = async (
  fullName: string,
  preferences: Preferences = {}
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
    .single();

  if (profileCheckError) throw profileCheckError;

  if (existingProfile) {
    console.log('User profile already exists, skipping insert.');
    return true;
  }

  // Insert into users table
  const { error: userInsertError } = await supabase.from('users').insert([
    {
      id: userId,
      full_name: fullName,
      email: user.email,
      is_pro: false,
      onboarding_complete: true,
    },
  ]);

  if (userInsertError) throw userInsertError;

  const {
    timezone = 'UTC',
    notification_opt_in = true,
    preferred_reminder_time = '09:00:00',
    preferred_ai_persona = 'gentle_guide',
  } = preferences;

  const { error: prefInsertError } = await supabase.from('user_preferences').insert([
    {
      user_id: userId,
      timezone,
      notification_opt_in,
      preferred_reminder_time,
      preferred_ai_persona,
    },
  ]);

  if (prefInsertError) throw prefInsertError;

  return true;
};

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
  } else {
    console.log('User signed out successfully');
  }
};

export const checkUserStatus = async () => {
  // Check local storage for onboarding status
  const onboardingComplete = await AsyncStorage.getItem('onboarding_complete');
  if (onboardingComplete === 'true') {
    return { status: 'complete' };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  if (!user) {
    // ✅ No user at all = fresh install
    return { status: 'brand_new' };
  }

  const { data, error } = await supabase
    .from('users')
    .select('onboarding_complete')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching onboarding status:', error);
    return { status: 'error' };
  }

  console.log('data', data);

  if (!data) {
    return { status: 'incomplete' }; // signed in, but row not created
  }

  // Store onboarding status in local storage
  await AsyncStorage.setItem('onboarding_complete', data.onboarding_complete ? 'true' : 'false');

  return data.onboarding_complete
    ? { status: 'complete' }
    : { status: 'incomplete' };
};

