import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addIdentityKeysBatch, IdentityKey } from './userKeys';

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

  // Get identity keys from AsyncStorage
  try {
    const futureSelfVision = await AsyncStorage.getItem('future_self_vision');
    const lifeGoals = await AsyncStorage.getItem('life_goals');
    const coreValues = await AsyncStorage.getItem('core_values');

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

    if (lifeGoals) {
      const goals = JSON.parse(lifeGoals);
      goals.forEach((goal: string) => {
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

    if (identityKeys.length > 0) {
      await addIdentityKeysBatch(identityKeys);
    }

    // Clean up AsyncStorage
    await AsyncStorage.multiRemove([
      'future_self_vision',
      'life_goals',
      'core_values',
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

  // Check local storage for onboarding status
  const onboardingComplete = await AsyncStorage.getItem('onboarding_complete');
  if (onboardingComplete === 'true') {
    return { status: 'complete' };
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

export const resendConfirmationEmail = async (email: string) => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) throw error;
  return true;
};