import { supabase } from '../lib/supabase';

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

export const checkUserOnboardingStatus = async () => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  const user = session?.user;

  if (sessionError || !user) {
    return { status: 'not_signed_in' };
  }

  const { data, error } = await supabase
    .from('users')
    .select('onboarding_complete')
    .eq('id', user.id)
    .maybeSingle(); // ✅ won't throw if no row is found

  if (error) {
    console.error('Error fetching onboarding status:', error);
    return { status: 'error' };
  }

  if (!data) {
    // No row exists yet — treat as onboarding not started
    return { status: 'incomplete' };
  }

  return data.onboarding_complete
    ? { status: 'complete' }
    : { status: 'incomplete' };
};
