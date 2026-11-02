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

const QUIZ_QUESTION_COUNT = 4;
const IDENTITY_STEPS = ['CoreValues', 'LifeGoals', 'FutureSelfVision'];
const TOTAL_STEPS = QUIZ_QUESTION_COUNT + IDENTITY_STEPS.length;

const getStepIndex = (pathname, questionNumber = null) => {
  if (pathname.includes('Quiz')) {
    return questionNumber ? parseInt(questionNumber) - 1 : 0;
  }
  const identityIndex = IDENTITY_STEPS.findIndex((name) => pathname.includes(name));
  return identityIndex === -1 ? 0 : QUIZ_QUESTION_COUNT + identityIndex;
};

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
        router.push('/onboarding/Welcome');
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