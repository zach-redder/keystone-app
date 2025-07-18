import { supabase } from '../lib/supabase';
import { BASE_URL } from '../lib/apiConfig';
import { fetchIdentityKeys } from './userKeys';
import { getPreferredAiPersona } from './userPreferences';
import { checkUserProStatus } from './auth';

/**
 * Calls the /generate-ai-message endpoint with the user's message, all keys, persona, and chat history.
 * @param {string} message - The user's message
 * @param {Array} messages - The chat history
 * @returns {Promise<string>} The AI's response
 */
export const generateAIMessage = async (message: string, messages: { role: string, content: string }[]): Promise<string> => {
  // Only send the last 4 message pairs (8 messages), not including the current user message
  let limitedMessages = messages;
  if (messages.length > 0) {
    // Only keep the last 6 messages (3 pairs)
    limitedMessages = messages.slice(-6);
  }

  // Fetch all keys, persona, and pro status
  const keys = await fetchIdentityKeys();
  const keyDescriptions = Array.isArray(keys) ? keys.map(k => k.description) : [];
  const persona = await getPreferredAiPersona();
  const isPro = await checkUserProStatus();
  const payload = { message, keyDescriptions, persona, messages: limitedMessages, isPro };
  const response = await fetch(`${BASE_URL}/generate-ai-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('AI backend error');
  const { ai_response } = await response.json();
  return ai_response;
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
