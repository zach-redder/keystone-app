import { getSessionUser } from '../auth/currentUser';
import { supabase } from '../../lib/supabase';

export interface CustomPersonality {
  id?: string;
  user_id?: string;
  name: string;
  description: string;
  icon: string;
  voice?: string | null;
  created_at?: string;
  isCustom?: boolean;
}

export const fetchCustomPersonalities = async (): Promise<CustomPersonality[]> => {
  try {
    const { data: { user }, error: userError } = await getSessionUser();
    
    if (userError || !user) {
      console.log('User not authenticated, returning empty custom personalities');
      return [];
    }

    const { data, error } = await supabase
      .from('custom_personalities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching custom personalities:', error);
      return [];
    }

    // Add isCustom flag for compatibility with existing code
    return (data || []).map(personality => ({
      ...personality,
      isCustom: true
    }));
  } catch (error) {
    console.error('Error in fetchCustomPersonalities:', error);
    return [];
  }
};

export const createCustomPersonality = async (personality: {
  name: string;
  description: string;
  icon: string;
  voice?: string;
}): Promise<CustomPersonality | null> => {
  try {
    const { data: { user }, error: userError } = await getSessionUser();
    
    if (userError || !user) {
      console.log('User not authenticated, cannot create custom personality');
      return null;
    }

    const { data, error } = await supabase
      .from('custom_personalities')
      .insert([
        {
          user_id: user.id,
          name: personality.name,
          description: personality.description,
          icon: personality.icon,
          voice: personality.voice ?? null,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating custom personality:', error);
      return null;
    }

    return {
      ...data,
      isCustom: true
    };
  } catch (error) {
    console.error('Error in createCustomPersonality:', error);
    return null;
  }
};

export const deleteCustomPersonality = async (personalityId: string): Promise<boolean> => {
  try {
    const { data: { user }, error: userError } = await getSessionUser();
    
    if (userError || !user) {
      console.log('User not authenticated, cannot delete custom personality');
      return false;
    }

    const { error } = await supabase
      .from('custom_personalities')
      .delete()
      .eq('id', personalityId)
      .eq('user_id', user.id); // Ensure user can only delete their own personalities

    if (error) {
      console.error('Error deleting custom personality:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteCustomPersonality:', error);
    return false;
  }
};

export const updateCustomPersonality = async (
  personalityId: string,
  updates: Partial<{ name: string; description: string; icon: string; voice: string | null }>
): Promise<boolean> => {
  try {
    const { data: { user }, error: userError } = await getSessionUser();
    
    if (userError || !user) {
      console.log('User not authenticated, cannot update custom personality');
      return false;
    }

    const { error } = await supabase
      .from('custom_personalities')
      .update(updates)
      .eq('id', personalityId)
      .eq('user_id', user.id); // Ensure user can only update their own personalities

    if (error) {
      console.error('Error updating custom personality:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateCustomPersonality:', error);
    return false;
  }
};