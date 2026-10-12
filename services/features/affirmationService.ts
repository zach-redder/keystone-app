import { supabase } from '../../lib/supabase';
import { BASE_URL } from '../../lib/apiConfig';
import { fetchIdentityKeys } from '../user/userKeys';
import { getPreferredAiPersona } from '../user/userPreferences';
import { checkUserProStatus } from '../subscription/subscriptionService';

export type ChatMode = 'affirm' | 'question';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatMessageWithRows extends ChatMessage {
  rowId: string;
}

interface AIResponse {
  ai_response: string;
}

export type KeysByCategory = Record<string, string[]>;

const MAX_HISTORY_MESSAGES = 10;

export const organizeKeysByCategory = (keys: Array<{ category: string; description: string }>): KeysByCategory => {
  const organized: KeysByCategory = {};

  keys.forEach(key => {
    const category = key.category.toLowerCase().replace(/\s+/g, '_');
    if (!organized[category]) {
      organized[category] = [];
    }
    organized[category].push(key.description);
  });

  return organized;
};

export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('User not authenticated');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
};

/**
 * Calls /generate-ai-message in the given mode. The backend identifies the user from the bearer token.
 */
export const generateAIMessage = async (mode: ChatMode, message: string, messages: ChatMessage[]): Promise<string> => {
  const limitedMessages = messages.slice(-MAX_HISTORY_MESSAGES);

  try {
    const keys = await fetchIdentityKeys();
    const persona = await getPreferredAiPersona();
    const isPro = await checkUserProStatus();

    const response = await fetch(`${BASE_URL}/generate-ai-message`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        message,
        mode,
        keys: organizeKeysByCategory(keys || []),
        persona,
        isPro,
        messages: limitedMessages,
      }),
    });

    if (!response.ok) throw new Error('AI backend error');
    const data: AIResponse = await response.json();
    return data.ai_response;
  } catch (error) {
    console.error('Error in generateAIMessage:', error);
    throw error;
  }
};

// Each mode keeps its own thread: rows are tagged with `mode`, and flattened here into a message array.
export const fetchAIChatMessages = async (mode: ChatMode): Promise<ChatMessageWithRows[]> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return [];
  const { data, error } = await supabase
    .from('ai_chat_logs')
    .select('id, user_message, assistant_message, order')
    .eq('user_id', user.id)
    .eq('mode', mode)
    .order('order', { ascending: true });
  if (error || !data) return [];

  const messages: ChatMessageWithRows[] = [];
  data.forEach(row => {
    if (row.user_message) {
      messages.push({ role: 'user', content: row.user_message, rowId: row.id });
    }
    if (row.assistant_message) {
      messages.push({ role: 'assistant', content: row.assistant_message, rowId: row.id });
    }
  });
  return messages;
};

// Rows the user hasn't run through "Review keys" yet, oldest first
export const fetchUnreviewedMessages = async (mode: ChatMode): Promise<ChatMessageWithRows[]> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return [];
  const { data, error } = await supabase
    .from('ai_chat_logs')
    .select('id, user_message, assistant_message, order')
    .eq('user_id', user.id)
    .eq('mode', mode)
    .is('reviewed_at', null)
    .order('order', { ascending: true });
  if (error || !data) return [];

  const messages: ChatMessageWithRows[] = [];
  data.forEach(row => {
    if (row.user_message) {
      messages.push({ role: 'user', content: row.user_message, rowId: row.id });
    }
    if (row.assistant_message) {
      messages.push({ role: 'assistant', content: row.assistant_message, rowId: row.id });
    }
  });
  return messages;
};

export const markChatRowsReviewed = async (rowIds: string[]): Promise<boolean> => {
  if (rowIds.length === 0) return true;
  const { error } = await supabase
    .from('ai_chat_logs')
    .update({ reviewed_at: new Date().toISOString() })
    .in('id', rowIds);
  if (error) {
    console.error('Error marking chat rows reviewed:', error);
  }
  return !error;
};

// Insert a new user/assistant message pair as a new row
export const insertAIChatMessagePair = async (mode: ChatMode, userMsg: ChatMessage, aiMsg: ChatMessage) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return false;
  const { data: orderData } = await supabase
    .from('ai_chat_logs')
    .select('order')
    .eq('user_id', user.id)
    .order('order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = orderData?.order ? orderData.order + 1 : 1;
  const { error: insertError } = await supabase
    .from('ai_chat_logs')
    .insert([
      {
        user_id: user.id,
        user_message: userMsg.content,
        assistant_message: aiMsg.content,
        order: nextOrder,
        mode,
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

// Delete all AI chat logs for the current user in one mode
export const deleteAllAIChatMessages = async (mode: ChatMode) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return false;
  const { error } = await supabase
    .from('ai_chat_logs')
    .delete()
    .eq('user_id', user.id)
    .eq('mode', mode);
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

// Total chat pairs per mode, for the Stats tab
export const fetchChatPairCountsByMode = async (): Promise<Record<ChatMode, number>> => {
  const counts: Record<ChatMode, number> = { affirm: 0, question: 0 };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return counts;

    await Promise.all((Object.keys(counts) as ChatMode[]).map(async (mode) => {
      const { count, error } = await supabase
        .from('ai_chat_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('mode', mode);
      if (error) {
        console.error(`Error fetching ${mode} chat count:`, error);
        return;
      }
      counts[mode] = count || 0;
    }));
  } catch (e) {
    console.error('Error in fetchChatPairCountsByMode:', e);
  }
  return counts;
};
