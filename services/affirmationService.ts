import { supabase } from '../lib/supabase';
import { BASE_URL } from '../lib/apiConfig';
import { fetchIdentityKeys } from './userKeys';
import { getPreferredAiPersona } from './userPreferences';
import { checkUserProStatus } from './auth';
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
  // Only send the last 4 message pairs (8 messages), not including the current user message
  let limitedMessages = messages;
  if (messages.length > 0) {
    // Only keep the last 6 messages (3 pairs)
    limitedMessages = messages.slice(-6);
  }

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    // Fetch all keys and organize them by category
    const keys = await fetchIdentityKeys();
    const organizedKeys = organizeKeysByCategory(keys || []);

    // Get other required data
    const persona = await getPreferredAiPersona();
    const isPro = await checkUserProStatus();

    // Prepare the request payload
    const payload = {
      message,
      keys: organizedKeys,
      persona,
      isPro,
      user_id: user.id,
      messages: limitedMessages
    };

    // Make the API request
    const response = await fetch(`${BASE_URL}/generate-ai-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('AI backend error');

    const data: AIResponse = await response.json();

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

        try {
          await supabase.from('user_alignment_scores').insert(scoreEntries);
        } catch (tableError) {
          // If table doesn't exist, try to store in legacy format
          const legacyUpdates = Object.entries(data.alignment_scores).reduce((acc, [keyType, scores]) => {
            // Calculate average score for legacy format
            const avgScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.values(scores).length;
            acc[keyType] = avgScore;
            return acc;
          }, {});

          await supabase
            .from('users')
            .update(legacyUpdates)
            .eq('id', user.id);
        }
      } catch (scoreError) {
        console.error('Error storing alignment scores:', scoreError);
        // Don't throw - this is non-critical
      }
    }

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
