import { supabase } from '../lib/supabase';
import { BASE_URL } from '../lib/apiConfig';
import { fetchUserPreferences } from './userPreferences';

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

export const submitActionLogWithAI = async (actionDescription, selectedKeys, isPro) => {
  try {
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    // Get preferred AI persona
    const preferences = await fetchUserPreferences();
    let persona = preferences?.preferred_ai_persona || '';
    // Remove anything after and including the colon
    persona = persona.replace(/:.*$/, '');

    // Prepare payload
    const keyTags = selectedKeys.map(k => k.description);
    const payload = {
      description: actionDescription,
      keys: keyTags,
      pro: isPro,
      persona,
    };

    console.log('payload', payload);

    // Send to AI backend
    const response = await fetch(`${BASE_URL}/action-log-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('AI backend error');
    const { ai_response } = await response.json();

    // Save to Supabase action_logs
    const { data, error } = await supabase
      .from('action_logs')
      .insert([
        {
          user_id: user.id,
          action_description: actionDescription,
          key_tags: keyTags,
          ai_response,
          ai_persona: persona,
        },
      ])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in submitActionLogWithAI:', error);
    throw error;
  }
};

// Returns the number of action logs the current user has created today (local time)
export const fetchTodaysActionLogCount = async (): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    // Get today's date in local time
    const today = new Date();
    const yyyy = today.getFullYear();

    // Create start and end timestamps for today in local timezone
    const startDate = new Date(yyyy, today.getMonth(), today.getDate());
    const endDate = new Date(yyyy, today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // Convert to ISO strings
    const start = startDate.toISOString();
    const end = endDate.toISOString();

    const { count, error } = await supabase
      .from('action_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', start)
      .lte('created_at', end);

    if (error) {
      console.error('Error fetching today\'s action log count:', error);
      return 0;
    }

    return count || 0;
  } catch (e) {
    console.error('Error in fetchTodaysActionLogCount:', e);
    return 0;
  }
};
