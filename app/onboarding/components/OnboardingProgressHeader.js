import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { useLocalSearchParams, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { styles } from '../../../styles/onboarding';

const shared = {
  progressAnim: new Animated.Value(0),
  previousStepIndex: 0,
  shouldAnimate: true,
};

// Complete onboarding flow with proper step ordering
const getStepIndex = (pathname, questionNumber = null) => {
  // Total steps: 7 quiz questions + 3 identity steps = 10 total steps
  if (pathname.includes('Quiz')) {
    // Quiz questions 1-7 (steps 0-6)
    return questionNumber ? parseInt(questionNumber) - 1 : 0;
  } else if (pathname.includes('FutureSelfVision')) {
    return 7; // Step 8 (after 7 quiz questions)
  } else if (pathname.includes('LifeGoals')) {
    return 8; // Step 9
  } else if (pathname.includes('CoreValues')) {
    return 9; // Step 10
  }
  return 0;
};

const TOTAL_STEPS = 10; // 7 quiz + 3 identity

export default function OnboardingProgressHeader({ showBackButton = true }) {
  const router = useRouter();
  const pathname = usePathname();
  const { questionNumber } = useLocalSearchParams();
  
  const currentStepIndex = getStepIndex(pathname, questionNumber);
  const progressPercentage = Math.round(((currentStepIndex + 1) / TOTAL_STEPS) * 100);

  useEffect(() => {
    if (!shared.shouldAnimate) {
      shared.shouldAnimate = true;
      return;
    }

    const targetProgress = (currentStepIndex + 1) / TOTAL_STEPS;

    Animated.timing(shared.progressAnim, {
      toValue: targetProgress,
      duration: 500,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();

    shared.previousStepIndex = currentStepIndex;
  }, [currentStepIndex]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (pathname.includes('Quiz')) {
      const currentQuestionNum = parseInt(questionNumber);
      if (currentQuestionNum > 1) {
        // Go to previous quiz question
        router.push(`/onboarding/Quiz/${currentQuestionNum - 1}`);
      } else {
        // Go back to Good News screen
        router.push('/onboarding/GoodNews');
      }
    } else {
      // For identity screens, use standard back navigation
      router.back();
    }
    
    shared.shouldAnimate = false;
  };

  return (
    <View style={styles.progressHeaderContainer}>
      <View style={styles.progressHeaderRow}>
        {showBackButton && (
          <TouchableOpacity onPress={handleBack} style={styles.progressBackButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: shared.progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>
        
        <View style={styles.progressSpacer} />
      </View>
    </View>
  );
}