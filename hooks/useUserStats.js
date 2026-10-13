import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { fetchUserStats } from '../services/user/userStats';

const EMPTY_STATS = {
  dayStreak: 0,
  longestStreak: 0,
  activeDays: [],
  dailyCounts: {},
  total: 0,
  week: 0,
  modeCounts: { affirm: 0, question: 0 },
};

// Shared by Home, Keys, Stats and Profile: one cached fetch instead of each screen scanning chat logs
export default function useUserStats() {
  const query = useQuery({ queryKey: queryKeys.userStats, queryFn: fetchUserStats });
  return { stats: query.data ?? EMPTY_STATS, loaded: query.data !== undefined, refetch: query.refetch };
}
