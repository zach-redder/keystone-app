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
      console.error('Error getting user:', userError);
      return null;
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user preferences:', error);
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
      console.error('Error getting user:', userError);
      return false;
    }

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating user preferences:', error);
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
