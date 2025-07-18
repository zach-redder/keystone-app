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

export const setPreferredAiPersona = async (persona: string): Promise<boolean> => {
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

/**
 * Updates the user's day streak in the users table by checking the action_logs table for consecutive days with logs (ending yesterday).
 * @returns {Promise<number>} The updated day streak.
 */
export const updateUserDayStreak = async (): Promise<number> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return 0;

    // Get all action logs for the user, ordered by created_at descending
    const { data: logs, error: logsError } = await supabase
      .from('action_logs')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (logsError) return 0;

    // Get all ai_chat_logs for the user
    const { data: aiLogs, error: aiLogsError } = await supabase
      .from('ai_chat_logs')
      .select('created_at')
      .eq('user_id', user.id);
    if (aiLogsError) return 0;

    // Build a set of unique days (YYYY-MM-DD) with at least one log from either table
    const daysWithLogs = new Set();
    if (Array.isArray(logs)) {
      logs.forEach(log => daysWithLogs.add(log.created_at.slice(0, 10)));
    }
    if (Array.isArray(aiLogs)) {
      aiLogs.forEach(log => daysWithLogs.add(log.created_at.slice(0, 10)));
    }

    // Start from today
    let streak = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0);
    let missedDays = 0;
    while (true) {
      const dayStr = current.toISOString().slice(0, 10);
      if (daysWithLogs.has(dayStr)) {
        streak++;
        missedDays = 0;
      } else {
        missedDays++;
        if (missedDays >= 2) {
          break;
        }
      }
      current.setDate(current.getDate() - 1);
    }

    // If the user hasn't logged today but did yesterday, keep the streak (don't increment for today)
    // But if they missed two days in a row, streak is 0
    // The above loop already handles this logic

    // Update the users table
    await supabase
      .from('users')
      .update({ day_streak: streak })
      .eq('id', user.id);

    return streak;
  } catch (error) {
    console.error('Error updating user day streak:', error);
    return 0;
  }
};

export const getUserDayStreak = async (): Promise<number> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('User not authenticated, returning 0 for day streak');
      return 0;
    }

    // Always update the streak before returning
    return await updateUserDayStreak();
  } catch (error) {
    console.error('Error in getUserDayStreak:', error);
    return 0;
  }
};

// ✅ Update User Name in public.users table
export const updateUserName = async (name: string): Promise<boolean> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return false;

    const { error } = await supabase
      .from('users')
      .update({ name })
      .eq('id', user.id);

    return !error;
  } catch (error) {
    console.error('Error updating user name:', error);
    return false;
  }
};

// ✅ Get User Name from public.users table
export const getUserName = async (): Promise<string> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return '';

    const { data, error } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single();

    if (error || !data?.name) return '';
    return data.name;
  } catch (error) {
    console.error('Error getting user name:', error);
    return '';
  }
};

// // ✅ Update Phone in Supabase Auth (not public.users)
// export const updateUserPhone = async (phone: string): Promise<boolean> => {
//   try {
//     const { data: { user }, error: userError } = await supabase.auth.getUser();
//     if (userError || !user) return false;

//     const { error } = await supabase.auth.updateUser({
//       phone
//     });

//     return !error;
//   } catch (error) {
//     console.error('Error updating user phone:', error);
//     return false;
//   }
// };

// // ✅ Get Phone from Supabase Auth
// export const getUserPhone = async (): Promise<string> => {
//   try {
//     const { data: { user }, error: userError } = await supabase.auth.getUser();
//     if (userError || !user) {
//       console.error('Error getting user for phone:', userError);
//       return '';
//     }

//     return user.phone ?? '';
//   } catch (error) {
//     console.error('Error in getUserPhone:', error);
//     return '';
//   }
// };