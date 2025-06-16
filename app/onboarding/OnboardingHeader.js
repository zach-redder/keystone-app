import { View, TouchableOpacity, Animated, Easing } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { styles } from '../../styles/onboarding';

const shared = {
  progressAnim: new Animated.Value(0),
  previousStepIndex: 0,
  shouldAnimate: true,
};

const steps = [
  'FutureSelfVision',
  'LifeGoals',
  'CoreValues',
  'AIPersonality',
  'NotificationOptIn',
  'NotificationTime',
];

export default function OnboardingHeader() {
  const { step } = useLocalSearchParams();
  const router = useRouter();

  const currentStepIndex = steps.indexOf(step);

  useEffect(() => {
    if (!shared.shouldAnimate) {
      shared.shouldAnimate = true;
      return;
    }

    const targetProgress = (currentStepIndex + 1) / steps.length;

    Animated.timing(shared.progressAnim, {
      toValue: targetProgress,
      duration: 400,
      useNativeDriver: false,
      easing: Easing.out(Easing.ease),
    }).start();

    shared.previousStepIndex = currentStepIndex;
  }, [currentStepIndex]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const prevIndex = currentStepIndex - 1;
    const targetProgress = (prevIndex + 1) / steps.length;

    shared.shouldAnimate = false;
    router.back();

    Animated.timing(shared.progressAnim, {
      toValue: targetProgress,
      duration: 400,
      useNativeDriver: false,
      easing: Easing.out(Easing.ease),
    }).start(() => {
      shared.previousStepIndex = prevIndex;
    });
  };

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={48} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBar,
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
  );
}
