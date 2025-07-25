import { supabase } from '../lib/supabase';
import { BASE_URL } from '../lib/apiConfig';

// Types for the new alignment system
export interface AlignmentKeys {
  core_values?: string[];
  identity_traits?: string[];
  future_self_vision?: string[];
  avoidances?: string[];
  motivations?: string[];
  life_goals?: string[];
}

export interface AlignmentScores {
  [keyType: string]: {
    [value: string]: number;  // Score between 0.0 and 1.0
  };
}

export interface AIResponse {
  ai_response: string;
  alignment_scores: AlignmentScores;
}

// Key type labels for the UI
export const KEY_TYPE_LABELS = {
  core_values: { deficient: 'Conformity', ideal: 'Integrity', excess: 'Dogmatism' },
  identity_traits: { deficient: 'Suppression', ideal: 'Authenticity', excess: 'Egotism' },
  future_self_vision: { deficient: 'Drift', ideal: 'Purpose', excess: 'Obsession' },
  avoidances: { deficient: 'Denial', ideal: 'Discernment', excess: 'Paranoia' },
  motivations: { deficient: 'Apathy', ideal: 'Drive', excess: 'Fixation' },
  life_goals: { deficient: 'Aimlessness', ideal: 'Vision', excess: 'Overreach' }
};

// Helper functions for score visualization
export const getScoreLabel = (keyType: string, score: number): string => {
  const labels = KEY_TYPE_LABELS[keyType];
  if (!labels) return '';
  
  if (score < 0.4) return labels.deficient;
  if (score > 0.6) return labels.excess;
  return labels.ideal;
};

export const getScoreColor = (score: number): string => {
  const distance = Math.abs(score - 0.5);
  if (distance < 0.1) return '#D4DE95';  // Very close to ideal - green
  if (distance < 0.2) return '#FFB74D';  // Slightly off - yellow
  return '#FF4C4C';                      // Significantly off - red
};

// Validation helper
export const validateKeys = (keys: AlignmentKeys): boolean => {
  const validTypes = Object.keys(KEY_TYPE_LABELS);
  return Object.keys(keys).every(type => 
    validTypes.includes(type) && 
    Array.isArray(keys[type]) &&
    keys[type].every(k => typeof k === 'string')
  );
};

// Legacy table mapping (for backward compatibility)
const LEGACY_KEY_TYPE_MAP = {
  'Core Values': 'core_values',
  'Identity Traits': 'identity_traits',
  'Future Identity': 'future_self_vision',
  'Avoidances': 'avoidances',
  'Motivations': 'motivations',
  'Life Goals': 'life_goals',
};

// Fetch alignment value for a specific key type
export const fetchAlignmentValue = async (keyType: string): Promise<number | null> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;

    // Convert UI key type to backend format
    const backendKeyType = keyType.toLowerCase().replace(/\s+/g, '_');

    // Try new table first
    try {
      const { data, error } = await supabase
        .from('user_alignment_scores')
        .select('score')
        .eq('user_id', user.id)
        .eq('key_type', backendKeyType)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        return data[0].score;
      }
    } catch (e) {
      // Table doesn't exist yet, continue to legacy check
    }

    // Fallback to legacy users table if new table doesn't exist
    const legacyColumn = LEGACY_KEY_TYPE_MAP[keyType] || backendKeyType;
    const { data: legacyData, error: legacyError } = await supabase
      .from('users')
      .select(legacyColumn)
      .eq('id', user.id)
      .single();

    if (!legacyError && legacyData && legacyData[legacyColumn] !== null) {
      return legacyData[legacyColumn];
    }

    return null;
  } catch (error) {
    console.error('Error in fetchAlignmentValue:', error);
    return null;
  }
};

// Fetch latest weekly snapshot
export const fetchLatestWeeklySnapshot = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;

    // Try new table first
    try {
      const { data, error } = await supabase
        .from('weekly_alignment_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('end_date', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        return data[0];
      }
    } catch (e) {
      // Table doesn't exist yet
    }

    // Fallback to legacy table if it exists
    try {
      const { data: legacyData, error: legacyError } = await supabase
        .from('weekly_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!legacyError && legacyData && legacyData.length > 0) {
        const snapshot = legacyData[0];
        // Convert legacy format to new format
        return {
          ...snapshot,
          top_keys_hit: Array.isArray(snapshot.top_keys_hit) ? snapshot.top_keys_hit : 
            (typeof snapshot.top_keys_hit === 'string' ? JSON.parse(snapshot.top_keys_hit) : []),
          top_keys_missed: Array.isArray(snapshot.top_keys_missed) ? snapshot.top_keys_missed :
            (typeof snapshot.top_keys_missed === 'string' ? JSON.parse(snapshot.top_keys_missed) : [])
        };
      }
    } catch (e) {
      // Legacy table doesn't exist either
    }

    return null;
  } catch (error) {
    console.error('Error in fetchLatestWeeklySnapshot:', error);
    return null;
  }
};

// Fetch alignment score change
export const fetchAlignmentScoreChange = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;

    // Try new table first
    try {
      const { data, error } = await supabase
        .from('alignment_score_changes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        return data[0];
      }
    } catch (e) {
      // Table doesn't exist yet
    }

    // Fallback to calculating from legacy weekly snapshots
    try {
      const { data: legacyData, error: legacyError } = await supabase
        .from('weekly_snapshots')
        .select('alignment_score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2);

      if (!legacyError && legacyData && legacyData.length >= 2) {
        const latest = legacyData[0]?.alignment_score;
        const previous = legacyData[1]?.alignment_score;
        
        if (typeof latest === 'number' && typeof previous === 'number') {
          const latestDist = Math.abs(latest - 0.5);
          const prevDist = Math.abs(previous - 0.5);
          const change = prevDist - latestDist;
          const percentChange = (change / 0.5) * 100;
          
          return {
            percent_change: percentChange,
            is_improvement: change > 0,
            created_at: legacyData[0].created_at
          };
        }
      }
    } catch (e) {
      // Legacy table doesn't exist either
    }

    return null;
  } catch (error) {
    console.error('Error in fetchAlignmentScoreChange:', error);
    return null;
  }
};
