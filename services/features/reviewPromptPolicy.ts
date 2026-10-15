// When it is acceptable to ask for an App Store rating. iOS itself shows the system prompt at most
// three times in 365 days and may skip it, so this only has to avoid being pushy: space requests out
// and stop well inside that limit.

export const MAX_REQUESTS_PER_YEAR = 3;
export const MIN_DAYS_BETWEEN_REQUESTS = 90;
// Streaks shorter than this are too early to be a moment worth interrupting
export const MIN_MILESTONE_DAYS_FOR_REVIEW = 7;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_YEAR = 365;

export const shouldRequestReview = (previousRequests: number[], now: number): boolean => {
  const lastYear = previousRequests.filter((at) => now - at < DAYS_PER_YEAR * MS_PER_DAY);
  if (lastYear.length >= MAX_REQUESTS_PER_YEAR) return false;

  const mostRecent = Math.max(0, ...previousRequests);
  return now - mostRecent >= MIN_DAYS_BETWEEN_REQUESTS * MS_PER_DAY;
};

export const isMilestoneWorthAsking = (days: number): boolean => days >= MIN_MILESTONE_DAYS_FOR_REVIEW;
