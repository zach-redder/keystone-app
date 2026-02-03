import { supabase } from '../../lib/supabase';

export interface CommunityComparison {
  userAlignment: number;
  averageAlignment: number;
  percentile: number;
  isAboveAverage: boolean;
  differencePercent: number;
}

export const getUserCommunityComparison = async (): Promise<CommunityComparison | null> => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return null;
    }

    // Get user's alignment scores
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('core_values, life_goals, future_self_vision')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      console.error('Error getting user data:', userDataError);
      return null;
    }

    // Calculate user's average alignment
    const userScores = [
      userData.core_values,
      userData.life_goals,
      userData.future_self_vision
    ].filter(score => score !== null && score !== undefined);

    if (userScores.length === 0) {
      return null;
    }

    const userAlignment = userScores.reduce((sum, score) => sum + score, 0) / userScores.length;

    // Get all users' alignment scores for comparison
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('core_values, life_goals, future_self_vision')
      .not('core_values', 'is', null)
      .not('life_goals', 'is', null)
      .not('future_self_vision', 'is', null);

    if (allUsersError || !allUsers) {
      console.error('Error getting all users data:', allUsersError);
      return null;
    }

    // Calculate average alignment across all users
    const allScores = allUsers.map(user => {
      const scores = [
        user.core_values,
        user.life_goals,
        user.future_self_vision
      ].filter(score => score !== null && score !== undefined);
      
      return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
    }).filter(score => score !== null);

    if (allScores.length === 0) {
      return null;
    }

    const averageAlignment = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;

    // Calculate percentile
    const scoresBelowUser = allScores.filter(score => score < userAlignment).length;
    const percentile = Math.round((scoresBelowUser / allScores.length) * 100);

    // Calculate difference percentage
    const differencePercent = Math.round(Math.abs((userAlignment - averageAlignment) / averageAlignment) * 100);

    return {
      userAlignment,
      averageAlignment,
      percentile,
      isAboveAverage: userAlignment > averageAlignment,
      differencePercent
    };
  } catch (error) {
    console.error('Error in getUserCommunityComparison:', error);
    return null;
  }
}; 