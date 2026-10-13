import { supabase } from '../../lib/supabase';

export interface UserStats {
  dayStreak: number;
  longestStreak: number;
  activeDays: string[];
  dailyCounts: Record<string, number>;
  total: number;
  week: number;
  modeCounts: { affirm: number; question: number };
}

/**
 * Everything the activity screens need in a single round trip (see get_user_stats in
 * supabase/migrations). Returns null when the function isn't available, so callers can fall
 * back to the older per-query path instead of breaking before the SQL has been applied.
 */
export const fetchUserStatsRpc = async (): Promise<UserStats | null> => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const { data, error } = await supabase.rpc('get_user_stats', { p_tz: timeZone });
  if (error || !data) {
    if (error) console.warn('get_user_stats unavailable, using fallback:', error.message);
    return null;
  }
  return {
    dayStreak: data.day_streak ?? 0,
    longestStreak: data.longest_streak ?? 0,
    activeDays: data.active_days ?? [],
    dailyCounts: data.daily_counts ?? {},
    total: Number(data.total ?? 0),
    week: Number(data.week ?? 0),
    modeCounts: { affirm: Number(data.affirm ?? 0), question: Number(data.question ?? 0) },
  };
};
