import { supabase } from '../../lib/supabase';
import { BASE_URL } from '../../lib/apiConfig';
import { fetchIdentityKeys } from '../user/userKeys';
import { getPreferredAiPersona } from '../user/userPreferences';
import { checkUserProStatus } from '../subscription/subscriptionService';
import { AlignmentKeys, AlignmentScores } from './alignmentService';

interface Message {
  role: string;
  content: string;
}

interface AIResponse {
  ai_response: string;
  alignment_scores?: AlignmentScores;
}

// Helper to organize keys by category
const organizeKeysByCategory = (keys: Array<{ category: string; description: string }>): AlignmentKeys => {
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

/**
 * Calls the /generate-ai-message endpoint with the user's message, all keys, persona, and chat history.
 * @param {string} message - The user's message
 * @param {Array} messages - The chat history
 * @returns {Promise<string>} The AI's response
 */
export const generateAIMessage = async (message: string, messages: Message[]): Promise<string> => {
  let limitedMessages = messages.length > 0 ? messages.slice(-10) : messages;

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    const keys = await fetchIdentityKeys();
    const organizedKeys = organizeKeysByCategory(keys || []);
    const persona = await getPreferredAiPersona();
    const isPro = await checkUserProStatus();

    const payload = {
      message,
      keys: organizedKeys,
      persona,
      isPro,
      user_id: user.id,
      messages: limitedMessages
    };

    const response = await fetch(`${BASE_URL}/generate-ai-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('AI backend error');
    const data: AIResponse = await response.json();

    // NO attempt to store alignment scores here!
    // You can optionally use data.alignment_scores to display updated info in the UI

    return data.ai_response;
  } catch (error) {
    console.error('Error in generateAIMessage:', error);
    throw error;
  }
};


// Fetch all chat log rows for the user, ordered by 'order', and flatten to message array
export const fetchAIChatMessages = async () => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return [];
  const { data, error } = await supabase
    .from('ai_chat_logs')
    .select('id, user_message, assistant_message, order')
    .eq('user_id', user.id)
    .order('order', { ascending: true });
  if (error || !data) return [];
  // Convert each row to two message objects (user, assistant)
  const messages = [];
  data.forEach(row => {
    if (row.user_message) {
      messages.push({ role: 'user', content: row.user_message });
    }
    if (row.assistant_message) {
      messages.push({ role: 'assistant', content: row.assistant_message });
    }
  });
  return messages;
};

// Insert a new user/assistant message pair as a new row
export const insertAIChatMessagePair = async (userMsg, aiMsg) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return false;
  // Get current max order
  const { data: orderData, error: orderError } = await supabase
    .from('ai_chat_logs')
    .select('order')
    .eq('user_id', user.id)
    .order('order', { ascending: false })
    .limit(1)
    .single();
  const nextOrder = orderData && orderData.order ? orderData.order + 1 : 1;
  const { error: insertError } = await supabase
    .from('ai_chat_logs')
    .insert([
      {
        user_id: user.id,
        user_message: userMsg.content,
        assistant_message: aiMsg.content,
        order: nextOrder,
      },
    ]);
  return !insertError;
};

// Returns the number of AI chat message pairs the current user has created today (local time)
export const fetchTodaysAIChatMessagePairCount = async (): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    // Get today's date in local time
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const start = `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
    const end = `${yyyy}-${mm}-${dd}T23:59:59.999Z`;

    const { count, error } = await supabase
      .from('ai_chat_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', start)
      .lte('created_at', end);

    if (error) {
      console.error('Error fetching today\'s AI chat message pair count:', error);
      return 0;
    }

    return count || 0;
  } catch (e) {
    console.error('Error in fetchTodaysAIChatMessagePairCount:', e);
    return 0;
  }
};

// Returns the total number of AI chat message pairs for the current user
export const fetchTotalAIChatMessagePairCount = async (): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('ai_chat_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching total AI chat message pair count:', error);
      return 0;
    }

    return count || 0;
  } catch (e) {
    console.error('Error in fetchTotalAIChatMessagePairCount:', e);
    return 0;
  }
};

// Delete all AI chat logs for the current user
export const deleteAllAIChatMessages = async () => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return false;
  const { error } = await supabase
    .from('ai_chat_logs')
    .delete()
    .eq('user_id', user.id);
  return !error;
};

export const fetchCurrentWeekAIChatMessagePairCount = async (): Promise<number> => {
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
      .from('ai_chat_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfWeek.toISOString())
      .lte('created_at', endOfWeek.toISOString());

    if (error) {
      console.error('Error fetching current week AI chat message pair count:', error);
      return 0;
    }

    return count || 0;
  } catch (e) {
    console.error('Error in fetchCurrentWeekAIChatMessagePairCount:', e);
    return 0;
  }
};
