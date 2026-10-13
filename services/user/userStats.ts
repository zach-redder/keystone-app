import { fetchUserStatsRpc, UserStats } from './statsRpc';
import {
  getUserDayStreak,
  getUserLongestStreak,
  getUserActiveDays,
  getUserDailyActivityCounts,
} from './userPreferences';
import {
  fetchChatPairCountsByMode,
  fetchTotalAIChatMessagePairCount,
  fetchCurrentWeekAIChatMessagePairCount,
} from '../features/affirmationService';

/**
 * Streaks, calendar and counts for the activity screens. One database call when `get_user_stats`
 * exists; otherwise the older per-metric queries, so the app still works if the SQL isn't applied yet.
 */
export const fetchUserStats = async (): Promise<UserStats> => {
  const stats = await fetchUserStatsRpc();
  if (stats) return stats;

  const [dayStreak, longestStreak, activeDays, dailyCounts, week, total, modeCounts] = await Promise.all([
    getUserDayStreak().catch(() => 0),
    getUserLongestStreak().catch(() => 0),
    getUserActiveDays().catch(() => []),
    getUserDailyActivityCounts().catch(() => ({})),
    fetchCurrentWeekAIChatMessagePairCount().catch(() => 0),
    fetchTotalAIChatMessagePairCount().catch(() => 0),
    fetchChatPairCountsByMode().catch(() => ({ affirm: 0, question: 0 })),
  ]);
  return { dayStreak, longestStreak, activeDays, dailyCounts, total, week, modeCounts };
};
