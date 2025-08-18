import { supabase } from '../lib/supabase';
import { BASE_URL } from '../lib/apiConfig';
import { fetchUserPreferences } from './userPreferences';
import { AlignmentKeys, AlignmentScores } from './alignmentService';

interface ActionLogResponse {
  ai_response: string;
  alignment_scores?: AlignmentScores;
}

// Helper to organize keys by category
const organizeKeysByCategory = (keys: Array<{ description: string; category: string }>): AlignmentKeys => {
  const organized: AlignmentKeys = {};
  
  keys.forEach(key => {
    const category = key.category.toLowerCase().replace(/\s+/g, '_');
    if (!organized[category]) {
      organized[category] = [];
    }
    organized[category].push(key.description);
  });
  
  return organized;
};

export const submitActionLogWithAI = async (actionDescription: string, selectedKeys: Array<{ description: string; category: string }>, isPro: boolean) => {
  try {
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    // Get preferred AI persona
    const preferences = await fetchUserPreferences();
    let persona = preferences?.preferred_ai_persona || '';
    // Remove anything after and including the colon
    persona = persona.replace(/:.*$/, '');

    // Organize keys by category
    const organizedKeys = organizeKeysByCategory(selectedKeys);

    // Prepare payload
    const payload = {
      description: actionDescription,
      keys: organizedKeys,
      pro: isPro,
      persona,
      user_id: user.id
    };

    // Send to AI backend
    const response = await fetch(`${BASE_URL}/action-log-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('AI backend error');
    const data: ActionLogResponse = await response.json();

    // Save to Supabase action_logs
    const { data: logData, error: logError } = await supabase
      .from('action_logs')
      .insert([{
        user_id: user.id,
        action_description: actionDescription,
        key_tags: selectedKeys.map(k => k.description),
        ai_response: data.ai_response,
        ai_persona: persona,
      }])
      .select('*')
      .single();

    if (logError) throw logError;

    // Handle alignment scores if present
    if (data.alignment_scores) {
      try {
        // Store the new alignment scores
        const scoreEntries = Object.entries(data.alignment_scores).map(([keyType, scores]) => ({
          user_id: user.id,
          key_type: keyType,
          scores,
          created_at: new Date().toISOString()
        }));

        await supabase.from('user_alignment_scores').insert(scoreEntries);
      } catch (scoreError) {
        console.error('Error storing alignment scores:', scoreError);
        // Don't throw - this is non-critical
      }
    }

    return logData;
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

export const fetchRecentActionLog = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;

    const { data, error } = await supabase
      .from('action_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching recent action log:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchRecentActionLog:', error);
    return null;
  }
};

export const fetchActionLogs = async (limit = 10) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return [];

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

export const fetchCurrentWeekActionLogs = async (): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    // Get the start of the current week (Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    // Get the end of the current week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const { count, error } = await supabase
      .from('action_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfWeek.toISOString())
      .lte('created_at', endOfWeek.toISOString());

    if (error) {
      console.error('Error fetching current week action logs:', error);
      return 0;
    }

    return count || 0;
  } catch (e) {
    console.error('Error in fetchCurrentWeekActionLogs:', e);
    return 0;
  }
};
