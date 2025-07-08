import { supabase } from '../lib/supabase';

export interface ActionLog {
  id: string;
  user_id: string;
  action: string;
  key_type?: string;
  created_at: string;
}

export const fetchRecentActionLog = async (): Promise<ActionLog | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No user found');
      return null;
    }

    const { data, error } = await supabase
      .from('action_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error fetching action log:', error);
      return null;
    }

    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error in fetchRecentActionLog:', error);
    return null;
  }
};

export const fetchActionLogs = async (limit: number = 10): Promise<ActionLog[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No user found');
      return [];
    }

    const { data, error } = await supabase
      .from('action_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching action logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchActionLogs:', error);
    return [];
  }
};

export const createActionLog = async (action: string, keyType?: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No user found');
      return false;
    }

    const { error } = await supabase
      .from('action_logs')
      .insert({
        user_id: user.id,
        action,
        key_type: keyType,
      });
    
    if (error) {
      console.error('Error creating action log:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in createActionLog:', error);
    return false;
  }
};
