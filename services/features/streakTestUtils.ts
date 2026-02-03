/**
 * Development utilities for testing the streak rewards system
 * Use these functions during development to test different streak scenarios
 */

import { resetShownMilestones, STREAK_MILESTONES } from './streakRewardsService';
import { supabase } from '../../lib/supabase';

/**
 * DEVELOPMENT ONLY: Manually set a user's day streak
 * This bypasses the normal calculation and sets the streak directly
 */
export const setTestDayStreak = async (testStreak: number): Promise<boolean> => {
  try {
    console.log(`🧪 TEST: Setting day streak to ${testStreak}`);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated');
      return false;
    }

    // Update the users table directly
    const { error } = await supabase
      .from('users')
      .update({ day_streak: testStreak })
      .eq('id', user.id);

    if (error) {
      console.error('Error setting test streak:', error);
      return false;
    }

    console.log(`✅ TEST: Day streak set to ${testStreak}`);
    return true;
  } catch (error) {
    console.error('Error in setTestDayStreak:', error);
    return false;
  }
};

/**
 * DEVELOPMENT ONLY: Reset all shown milestones to test rewards again
 */
export const resetMilestonesForTesting = async (): Promise<void> => {
  console.log('🧪 TEST: Resetting all shown milestones');
  await resetShownMilestones();
  console.log('✅ TEST: Milestones reset - rewards will show again');
};

/**
 * DEVELOPMENT ONLY: Test a specific milestone
 * This sets the streak and resets milestones to trigger the reward
 */
export const testSpecificMilestone = async (milestoneDays: number): Promise<boolean> => {
  const milestone = STREAK_MILESTONES.find(m => m.days === milestoneDays);
  if (!milestone) {
    console.error(`❌ TEST: No milestone found for ${milestoneDays} days`);
    return false;
  }

  console.log(`🧪 TEST: Testing ${milestoneDays}-day milestone: "${milestone.title}"`);
  
  // Reset milestones first
  await resetMilestonesForTesting();
  
  // Set the streak
  const success = await setTestDayStreak(milestoneDays);
  
  if (success) {
    console.log('✅ TEST: Navigate to home screen to see the reward!');
  }
  
  return success;
};

/**
 * DEVELOPMENT ONLY: Get a list of all available milestones for testing
 */
export const getAvailableMilestones = () => {
  console.log('🎯 Available milestones for testing:');
  STREAK_MILESTONES.forEach(milestone => {
    console.log(`  ${milestone.days} days: ${milestone.title} ${milestone.emoji}`);
  });
  return STREAK_MILESTONES;
};

/**
 * DEVELOPMENT ONLY: Test the progression through multiple milestones
 */
export const testMilestoneProgression = async (): Promise<void> => {
  console.log('🧪 TEST: Starting milestone progression test');
  
  const testMilestones = [3, 7, 14, 30];
  
  for (const days of testMilestones) {
    console.log(`\n🎯 Testing ${days}-day milestone...`);
    await testSpecificMilestone(days);
    
    // Wait for user to see the reward (in real testing, you'd manually navigate)
    console.log('💡 Navigate to home screen to see the reward, then come back to continue...');
    
    // In a real test scenario, you'd add a delay or wait for user input
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✅ TEST: Milestone progression test completed!');
};

// Log available test functions when this module is imported
console.log(`
🧪 STREAK TESTING UTILITIES AVAILABLE:
  - setTestDayStreak(days): Set streak to specific value
  - resetMilestonesForTesting(): Reset shown milestones  
  - testSpecificMilestone(days): Test a specific milestone
  - getAvailableMilestones(): List all milestones
  - testMilestoneProgression(): Test multiple milestones

Example usage:
  import { testSpecificMilestone } from './services/streakTestUtils';
  testSpecificMilestone(7); // Test the 7-day milestone
`);