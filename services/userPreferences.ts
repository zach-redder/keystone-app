import { supabase } from '../lib/supabase';

export interface UserPreferences {
  timezone?: string;
  notification_opt_in?: boolean;
  preferred_reminder_time?: string;
  preferred_ai_persona?: string;
}

export const fetchUserPreferences = async (): Promise<UserPreferences | null> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('User not authenticated, returning null for preferences');
      return null;
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(); // Use maybeSingle instead of single

    if (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }

    if (!data) {
      console.log('User preferences not found, returning null');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchUserPreferences:', error);
    return null;
  }
};

export const updateUserPreferences = async (preferences: Partial<UserPreferences>): Promise<boolean> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('User not authenticated, cannot update preferences');
      return false;
    }

    // First check if user preferences record exists
    const { data: existingPrefs } = await supabase
      .from('user_preferences')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating user preferences:', error);
      
      // If it's an RLS policy violation, it might mean the user record doesn't exist in users table
      if (error.code === '42501') {
        console.error('RLS policy violation - user may not have a record in users table');
      }
      
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserPreferences:', error);
    return false;
  }
};

export const getPreferredAiPersona = async (): Promise<string> => {
  try {
    const preferences = await fetchUserPreferences();
    return preferences?.preferred_ai_persona || 'Default';
  } catch (error) {
    console.error('Error getting preferred AI persona:', error);
    return 'Default';
  }
};

export const updatePreferredAiPersona = async (persona: string): Promise<boolean> => {
  try {
    return await updateUserPreferences({ preferred_ai_persona: persona });
  } catch (error) {
    console.error('Error updating preferred AI persona:', error);
    return false;
  }
};

export const getNotificationOptIn = async (): Promise<boolean> => {
  try {
    const preferences = await fetchUserPreferences();
    return preferences?.notification_opt_in || false;
  } catch (error) {
    console.error('Error getting notification opt-in preference:', error);
    return false;
  }
};

export const updateNotificationOptIn = async (optIn: boolean): Promise<boolean> => {
  try {
    return await updateUserPreferences({ notification_opt_in: optIn });
  } catch (error) {
    console.error('Error updating notification opt-in preference:', error);
    return false;
  }
};

export const getUserEmail = async (): Promise<string> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user for email:', userError);
      return '';
    }

    return user.email || '';
  } catch (error) {
    console.error('Error in getUserEmail:', error);
    return '';
  }
};

export const getPreferredReminderTime = async (): Promise<string> => {
  try {
    const preferences = await fetchUserPreferences();
    return preferences?.preferred_reminder_time || '9:00 AM';
  } catch (error) {
    console.error('Error getting preferred reminder time:', error);
    return '9:00 AM';
  }
};

export const updatePreferredReminderTime = async (time: string): Promise<boolean> => {
  try {
    return await updateUserPreferences({ preferred_reminder_time: time });
  } catch (error) {
    console.error('Error updating preferred reminder time:', error);
    return false;
  }
};

export const getUserDayStreak = async (): Promise<number> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('User not authenticated, returning 0 for day streak');
      return 0;
    }

    const { data, error } = await supabase
      .from('users')
      .select('day_streak')
      .eq('id', user.id)
      .maybeSingle(); // Use maybeSingle instead of single

    if (error) {
      console.error('Error fetching user day streak:', error);
      return 0;
    }

    if (!data) {
      console.log('User record not found, returning 0 for day streak');
      return 0;
    }

    return data?.day_streak || 0;
  } catch (error) {
    console.error('Error in getUserDayStreak:', error);
    return 0;
  }
};
