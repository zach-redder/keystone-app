import { supabase } from '../lib/supabase';
import { BASE_URL } from '../lib/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Utility function to calculate alignment scores from quiz answers (for testing and verification)
export const calculateAlignmentScoresFromQuizAnswers = (quizAnswers: { [key: string]: number }) => {
  // Map quiz questions to alignment categories and calculate scores
  // Quiz answers are 0-3 (Never=0, Sometimes=1, Often=2, Always=3)
  // We want to map these to alignment scores where 0.5 is ideal
  
  const alignmentScores: { [keyType: string]: number } = {
    core_values: 0.5,      // Default to ideal
    identity_traits: 0.5,   // Default to ideal
    future_self_vision: 0.5, // Default to ideal
    avoidances: 0.5,        // Default to ideal
    motivations: 0.5,       // Default to ideal
    life_goals: 0.5         // Default to ideal
  };

  // Question 1: "How often do you stay true to your word?" -> Core Values
  if (quizAnswers['question_1_score'] !== undefined) {
    const score = quizAnswers['question_1_score'];
    // Higher scores (Always=3) indicate better alignment with core values
    alignmentScores.core_values = 0.3 + (score * 0.2); // Maps 0->0.3, 3->0.9
  }

  // Question 2: "How often do you say yes to people when you mean no?" -> Identity Traits
  if (quizAnswers['question_2_score'] !== undefined) {
    const score = quizAnswers['question_2_score'];
    // Lower scores (Never=0) indicate better authenticity
    alignmentScores.identity_traits = 0.7 - (score * 0.2); // Maps 0->0.7, 3->0.1
  }

  // Question 3: "How often do you keep your dreams & goals hidden?" -> Future Self Vision
  if (quizAnswers['question_3_score'] !== undefined) {
    const score = quizAnswers['question_3_score'];
    // Lower scores (Never=0) indicate better future self alignment
    alignmentScores.future_self_vision = 0.7 - (score * 0.2); // Maps 0->0.7, 3->0.1
  }

  // Question 4: "Do you feel like your daily actions reflect who you really are?" -> Core Values
  if (quizAnswers['question_4_score'] !== undefined) {
    const score = quizAnswers['question_4_score'];
    // Higher scores (Always=3) indicate better alignment
    const question4Score = 0.3 + (score * 0.2); // Maps 0->0.3, 3->0.9
    // Average with previous core_values score
    alignmentScores.core_values = (alignmentScores.core_values + question4Score) / 2;
  }

  // Question 5: "When you fall off track what do you tend to do?" -> Motivations
  if (quizAnswers['question_5_score'] !== undefined) {
    const score = quizAnswers['question_5_score'];
    // "Get back up immediately" (0) is ideal, "Give up" (3) is deficient
    alignmentScores.motivations = 0.7 - (score * 0.2); // Maps 0->0.7, 3->0.1
  }

  // Question 6: "How often do you think about what people think of you?" -> Identity Traits
  if (quizAnswers['question_6_score'] !== undefined) {
    const score = quizAnswers['question_6_score'];
    // Lower scores (Never=0) indicate better authenticity
    const question6Score = 0.7 - (score * 0.2); // Maps 0->0.7, 3->0.1
    // Average with previous identity_traits score
    alignmentScores.identity_traits = (alignmentScores.identity_traits + question6Score) / 2;
  }

  // Question 7: "How often do you doubt yourself?" -> Life Goals
  if (quizAnswers['question_7_score'] !== undefined) {
    const score = quizAnswers['question_7_score'];
    // Lower scores (Never=0) indicate better vision and purpose
    alignmentScores.life_goals = 0.7 - (score * 0.2); // Maps 0->0.7, 3->0.1
  }

  // Ensure all scores are within valid range (0-1)
  Object.keys(alignmentScores).forEach(key => {
    alignmentScores[key] = Math.max(0, Math.min(1, alignmentScores[key]));
  });

  return alignmentScores;
};

// Calculate initial alignment scores from quiz answers
export const calculateInitialAlignmentScores = async (quizAnswers: { [key: string]: number }): Promise<boolean> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated for alignment score calculation');
      return false;
    }

    // Map quiz questions to alignment categories and calculate scores
    // Quiz answers are 0-3 (Never=0, Sometimes=1, Often=2, Always=3)
    // We want to map these to alignment scores where 0.5 is ideal
    
    const alignmentScores: { [keyType: string]: number } = {
      core_values: 0.5,      // Default to ideal
      identity_traits: 0.5,   // Default to ideal
      future_self_vision: 0.5, // Default to ideal
      avoidances: 0.5,        // Default to ideal
      motivations: 0.5,       // Default to ideal
      life_goals: 0.5         // Default to ideal
    };

    // Question 1: "How often do you stay true to your word?" -> Core Values
    if (quizAnswers['question_1_score'] !== undefined) {
      const score = quizAnswers['question_1_score'];
      // Higher scores (Always=3) indicate better alignment with core values
      alignmentScores.core_values = 0.3 + (score * 0.2); // Maps 0->0.3, 3->0.9
    }

    // Question 2: "How often do you say yes to people when you mean no?" -> Identity Traits
    if (quizAnswers['question_2_score'] !== undefined) {
      const score = quizAnswers['question_2_score'];
      // Lower scores (Never=0) indicate better authenticity
      alignmentScores.identity_traits = 0.7 - (score * 0.2); // Maps 0->0.7, 3->0.1
    }

    // Question 3: "How often do you keep your dreams & goals hidden?" -> Future Self Vision
    if (quizAnswers['question_3_score'] !== undefined) {
      const score = quizAnswers['question_3_score'];
      // Lower scores (Never=0) indicate better future self alignment
      alignmentScores.future_self_vision = 0.7 - (score * 0.2); // Maps 0->0.7, 3->0.1
    }

    // Question 4: "Do you feel like your daily actions reflect who you really are?" -> Core Values
    if (quizAnswers['question_4_score'] !== undefined) {
      const score = quizAnswers['question_4_score'];
      // Higher scores (Always=3) indicate better alignment
      const question4Score = 0.3 + (score * 0.2); // Maps 0->0.3, 3->0.9
      // Average with previous core_values score
      alignmentScores.core_values = (alignmentScores.core_values + question4Score) / 2;
    }

    // Question 5: "When you fall off track what do you tend to do?" -> Motivations
    if (quizAnswers['question_5_score'] !== undefined) {
      const score = quizAnswers['question_5_score'];
      // "Get back up immediately" (0) is ideal, "Give up" (3) is deficient
      alignmentScores.motivations = 0.7 - (score * 0.2); // Maps 0->0.7, 3->0.1
    }

    // Question 6: "How often do you think about what people think of you?" -> Identity Traits
    if (quizAnswers['question_6_score'] !== undefined) {
      const score = quizAnswers['question_6_score'];
      // Lower scores (Never=0) indicate better authenticity
      const question6Score = 0.7 - (score * 0.2); // Maps 0->0.7, 3->0.1
      // Average with previous identity_traits score
      alignmentScores.identity_traits = (alignmentScores.identity_traits + question6Score) / 2;
    }

    // Question 7: "How often do you doubt yourself?" -> Life Goals
    if (quizAnswers['question_7_score'] !== undefined) {
      const score = quizAnswers['question_7_score'];
      // Lower scores (Never=0) indicate better vision and purpose
      alignmentScores.life_goals = 0.7 - (score * 0.2); // Maps 0->0.7, 3->0.1
    }

    // Store alignment scores in the users table
    const { error } = await supabase
      .from('users')
      .update({
        core_values: Math.max(0, Math.min(1, alignmentScores.core_values)),
        identity_traits: Math.max(0, Math.min(1, alignmentScores.identity_traits)),
        future_self_vision: Math.max(0, Math.min(1, alignmentScores.future_self_vision)),
        avoidances: Math.max(0, Math.min(1, alignmentScores.avoidances)),
        motivations: Math.max(0, Math.min(1, alignmentScores.motivations)),
        life_goals: Math.max(0, Math.min(1, alignmentScores.life_goals))
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error storing alignment scores:', error);
      return false;
    }

    console.log('Initial alignment scores calculated and stored:', alignmentScores);
    return true;
  } catch (error) {
    console.error('Error calculating initial alignment scores:', error);
    return false;
  }
};

// Clear all user data including quiz answers and alignment scores
export const clearAllUserData = async (): Promise<boolean> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated for data clearing');
      return false;
    }

    // Clear alignment scores by setting them to null in users table
    const { error: alignmentError } = await supabase
      .from('users')
      .update({
        core_values: null,
        identity_traits: null,
        future_self_vision: null,
        avoidances: null,
        motivations: null,
        life_goals: null
      })
      .eq('id', user.id);

    if (alignmentError) {
      console.error('Error clearing alignment scores:', alignmentError);
    }

    // Clear user preferences
    const { error: prefsError } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', user.id);

    if (prefsError) {
      console.error('Error clearing user preferences:', prefsError);
    }

    // Clear action logs
    const { error: logsError } = await supabase
      .from('action_logs')
      .delete()
      .eq('user_id', user.id);

    if (logsError) {
      console.error('Error clearing action logs:', logsError);
    }

    // Clear user keys
    const { error: keysError } = await supabase
      .from('user_keys')
      .delete()
      .eq('user_id', user.id);

    if (keysError) {
      console.error('Error clearing user keys:', keysError);
    }

    // Clear reminders
    const { error: reminderError } = await supabase
      .from('user_reminders')
      .delete()
      .eq('user_id', user.id);

    if (reminderError) {
      console.error('Error clearing reminders:', reminderError);
    }

    // Clear weekly snapshots
    const { error: snapshotError } = await supabase
      .from('weekly_alignment_snapshots')
      .delete()
      .eq('user_id', user.id);

    if (snapshotError) {
      console.error('Error clearing weekly snapshots:', snapshotError);
    }

    // Clear alignment score changes
    const { error: changesError } = await supabase
      .from('alignment_score_changes')
      .delete()
      .eq('user_id', user.id);

    if (changesError) {
      console.error('Error clearing alignment score changes:', changesError);
    }

    // Clear AsyncStorage data including quiz answers
    try {
      const keysToRemove = [
        'quiz_answers',
        '@user_name',
        '@user_age',
        '@user_preferences',
        '@user_keys',
        '@user_reminders',
        '@user_alignment_scores',
        '@user_action_logs',
        '@user_weekly_snapshots',
        '@user_alignment_changes',
        'pending_referral_code',
        'pending_alignment_scores'
      ];

      for (const key of keysToRemove) {
        await AsyncStorage.removeItem(key);
      }
      console.log('AsyncStorage data cleared successfully');
    } catch (asyncError) {
      console.error('Error clearing AsyncStorage data:', asyncError);
    }

    console.log('All user data cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing all user data:', error);
    return false;
  }
};
