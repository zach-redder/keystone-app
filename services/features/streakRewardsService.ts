import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StreakMilestone {
  days: number;
  title: string;
  message: string;
  emoji: string;
  color: string;
}

// Define milestone rewards
export const STREAK_MILESTONES: StreakMilestone[] = [
  {
    days: 3,
    title: "Building Momentum!",
    message: "3 days strong! Your commitment is starting to show. Keep the energy flowing.",
    emoji: "🔥",
    color: "#FF6B35"
  },
  {
    days: 7,
    title: "One Week Warrior!",
    message: "7 days of dedication! You're building a powerful habit. Your future self will thank you.",
    emoji: "⚡",
    color: "#FFD23F"
  },
  {
    days: 14,
    title: "Two Weeks Strong!",
    message: "14 days of consistency! You're proving that commitment beats motivation every time.",
    emoji: "💪",
    color: "#EE6C4D"
  },
  {
    days: 21,
    title: "Habit Master!",
    message: "21 days! Three straight weeks of showing up. You're officially in the zone!",
    emoji: "🎯",
    color: "#3D5A80"
  },
  {
    days: 30,
    title: "Monthly Legend!",
    message: "30 days of pure dedication! You've shown incredible discipline. You're unstoppable!",
    emoji: "👑",
    color: "#B08D57"
  },
  {
    days: 50,
    title: "Unstoppable Force!",
    message: "50 days! Your consistency is inspiring. You're building something truly extraordinary.",
    emoji: "🚀",
    color: "#9B59B6"
  },
  {
    days: 75,
    title: "Elite Performer!",
    message: "75 days of excellence! That's real consistency. Keep soaring!",
    emoji: "⭐",
    color: "#E74C3C"
  },
  {
    days: 100,
    title: "Centurion Achievement!",
    message: "100 days! You've reached legendary status. Your dedication is absolutely phenomenal!",
    emoji: "💎",
    color: "#2E86AB"
  }
];

const SHOWN_MILESTONES_KEY = 'shownStreakMilestones';

/**
 * Get milestones that have already been shown to the user
 */
export const getShownMilestones = async (): Promise<number[]> => {
  try {
    const stored = await AsyncStorage.getItem(SHOWN_MILESTONES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting shown milestones:', error);
    return [];
  }
};

/**
 * Mark a milestone as shown
 */
export const markMilestoneAsShown = async (days: number): Promise<void> => {
  try {
    const shownMilestones = await getShownMilestones();
    if (!shownMilestones.includes(days)) {
      shownMilestones.push(days);
      await AsyncStorage.setItem(SHOWN_MILESTONES_KEY, JSON.stringify(shownMilestones));
    }
  } catch (error) {
    console.error('Error marking milestone as shown:', error);
  }
};

/**
 * Check if a streak milestone should be celebrated
 * Returns the milestone to show, or null if none
 */
export const checkForStreakMilestone = async (currentStreak: number): Promise<StreakMilestone | null> => {
  try {
    const shownMilestones = await getShownMilestones();
    
    // Find the highest milestone that the user has reached but hasn't been shown
    const eligibleMilestone = STREAK_MILESTONES
      .filter(milestone => currentStreak >= milestone.days)
      .filter(milestone => !shownMilestones.includes(milestone.days))
      .sort((a, b) => b.days - a.days)[0]; // Get the highest one

    return eligibleMilestone || null;
  } catch (error) {
    console.error('Error checking for streak milestone:', error);
    return null;
  }
};

/**
 * Reset shown milestones (useful for testing or if user wants to see them again)
 */
export const resetShownMilestones = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SHOWN_MILESTONES_KEY);
  } catch (error) {
    console.error('Error resetting shown milestones:', error);
  }
};

/**
 * Get the next milestone the user is working towards
 */
export const getNextMilestone = (currentStreak: number): StreakMilestone | null => {
  return STREAK_MILESTONES.find(milestone => milestone.days > currentStreak) || null;
};

/**
 * Calculate progress towards next milestone as percentage
 */
export const getMilestoneProgress = (currentStreak: number): { progress: number; nextMilestone: StreakMilestone | null } => {
  const nextMilestone = getNextMilestone(currentStreak);
  
  if (!nextMilestone) {
    return { progress: 100, nextMilestone: null };
  }

  // Find the previous milestone to calculate progress between them
  const previousMilestones = STREAK_MILESTONES.filter(m => m.days <= currentStreak);
  const previousMilestone = previousMilestones.length > 0 ? 
    previousMilestones[previousMilestones.length - 1] : 
    { days: 0 };

  const totalRange = nextMilestone.days - previousMilestone.days;
  const currentProgress = currentStreak - previousMilestone.days;
  const progress = Math.min(100, Math.max(0, (currentProgress / totalRange) * 100));

  return { progress, nextMilestone };
};