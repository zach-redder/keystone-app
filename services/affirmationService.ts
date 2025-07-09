import { supabase } from '../lib/supabase';

export interface AffirmationEntry {
  id?: string;
  user_id: string;
  question_text: string;
  user_response: string;
  ai_response: string;
  created_at?: string;
}
 
export const saveAffirmationEntry = async (
  questionText: string,
  userResponse: string,
  aiResponse: string
): Promise<AffirmationEntry | null> => {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('affirmation_entries')
      .insert([
        {
          user_id: user.id,
          question_text: questionText,
          user_response: userResponse,
          ai_response: aiResponse,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving affirmation entry:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in saveAffirmationEntry:', error);
    throw error;
  }
};

export const fetchRecentAffirmations = async (limit: number = 10): Promise<AffirmationEntry[]> => {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('affirmation_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching affirmation entries:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchRecentAffirmations:', error);
    throw error;
  }
};

export const deleteAffirmationEntry = async (entryId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('affirmation_entries')
      .delete()
      .eq('id', entryId);

    if (error) {
      console.error('Error deleting affirmation entry:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteAffirmationEntry:', error);
    throw error;
  }
};
