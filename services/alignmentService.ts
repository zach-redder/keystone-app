import { supabase } from '../lib/supabase';

// Map key types to their corresponding column names in the users table
const keyTypeToColumn = {
  'Core Values': 'core_values',
  'Identity Traits': 'identity_traits',
  'Future Identity': 'future_self_vision',
  'Avoidances': 'avoidances',
  'Motivations': 'motivations',
  'Life Goals': 'life_goals',
};

/**
 * Fetches the alignment value for a specific key type for the current user.
 * @param {string} keyType - The key type (e.g., 'Core Values')
 * @returns {Promise<number|null>} The alignment value (float) or null if not found.
 */
export const fetchAlignmentValue = async (keyType) => {
  const column = keyTypeToColumn[keyType];
  if (!column) return null;
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;
    const { data, error } = await supabase
      .from('users')
      .select(column)
      .eq('id', user.id)
      .single();
    if (error || data[column] === undefined || data[column] === null) return null;
    return data[column];
  } catch (error) {
    console.error('Error fetching alignment value:', error);
    return null;
  }
};

/**
 * Fetches all alignment values for the current user as an object keyed by key type.
 * @returns {Promise<Object>} An object like { 'Core Values': 0.7, ... }
 */
export const fetchAllAlignmentValues = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return {};
    const columns = Object.values(keyTypeToColumn);
    const { data, error } = await supabase
      .from('users')
      .select(columns.join(','))
      .eq('id', user.id)
      .single();
    if (error || !data) return {};
    // Map back to key types
    const result = {};
    for (const [keyType, column] of Object.entries(keyTypeToColumn)) {
      result[keyType] = data[column] ?? null;
    }
    return result;
  } catch (error) {
    console.error('Error fetching all alignment values:', error);
    return {};
  }
};

/**
 * Fetches the most recent weekly snapshot for the current user.
 * @returns {Promise<Object|null>} The latest weekly snapshot or null if none exists.
 */
export const fetchLatestWeeklySnapshot = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;
    const { data, error } = await supabase
      .from('weekly_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error || !data || data.length === 0) return null;
    const snapshot = data[0];
    // Ensure top_keys_hit and top_keys_missed are arrays
    let topKeysHit = snapshot.top_keys_hit;
    let topKeysMissed = snapshot.top_keys_missed;
    if (typeof topKeysHit === 'string') {
      try { topKeysHit = JSON.parse(topKeysHit); } catch { topKeysHit = []; }
    }
    if (typeof topKeysMissed === 'string') {
      try { topKeysMissed = JSON.parse(topKeysMissed); } catch { topKeysMissed = []; }
    }
    return {
      ...snapshot,
      top_keys_hit: Array.isArray(topKeysHit) ? topKeysHit : [],
      top_keys_missed: Array.isArray(topKeysMissed) ? topKeysMissed : [],
    };
  } catch (error) {
    console.error('Error fetching latest weekly snapshot:', error);
    return null;
  }
};

/**
 * Fetches the two most recent weekly snapshots for the current user and calculates the percent change in alignment_score,
 * considering movement toward 0.5 as positive (improvement) and away from 0.5 as negative (decline).
 * @returns {Promise<{ percentChange: number, isImprovement: boolean } | null>}
 */
export const fetchAlignmentScoreChange = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;
    const { data, error } = await supabase
      .from('weekly_snapshots')
      .select('alignment_score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(2);
    if (error || !data || data.length < 2) return null;
    const latest = data[0]?.alignment_score;
    const previous = data[1]?.alignment_score;
    if (typeof latest !== 'number' || typeof previous !== 'number') return null;
    // Calculate distance to 0.5 for both
    const latestDist = Math.abs(latest - 0.5);
    const prevDist = Math.abs(previous - 0.5);
    // Positive percent if moving toward 0.5, negative if away
    const change = prevDist - latestDist;
    // Use 0.5 as the denominator for percent of total possible distance
    const percentChange = (change / 0.5) * 100;
    const isImprovement = change > 0;
    return { percentChange, isImprovement };
  } catch (error) {
    console.error('Error fetching alignment score change:', error);
    return null;
  }
};
