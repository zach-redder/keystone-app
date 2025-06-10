import { useRouter,useLocalSearchParams } from 'expo-router';
import { View, Text, Pressable, Image } from 'react-native';
import React, { useEffect } from 'react';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function OnboardingStep() {
  const { step } = useLocalSearchParams();
  const router = useRouter();

  const nextStepMap = {
    Welcome: 'PreferredAIPersona',
    PreferredAIPersona: 'NotificationOptIn',
    NotificationOptIn: 'PreferredReminderTime',
    PreferredReminderTime: 'login',
  };

  const handleNext = () => {
    const nextStep = nextStepMap[step];
    if (nextStep) {
      router.replace(`/onboarding/${nextStep}`);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'Welcome':
        return (
          <View style={styles.container}>
            <LinearGradient
              colors={['#111111', '#1b1b1b', '#0a0a0a']}
              style={styles.gradientBg}
            />

            {/* Logo Glow Wrapper */}
            <Animated.View entering={FadeIn} style={styles.logoWrapper}>
              <Image
                source={require('../../assets/keystone_transparent.png')}
                style={styles.logo}
              />
            </Animated.View>

            <Text style={styles.title}>Welcome!</Text>
            <Text style={styles.subtitle}>
              You just chose to stop living for others.
            </Text>

            <Pressable
              onPress={handleNext}
              style={({ pressed }) => [
                styles.button,
                pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
              ]}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </Pressable>
          </View>
        )
      case 'PreferredAIPersona':
        return (
          <>
            <Text style={styles.title}>Select your preferred AI persona</Text>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </>
        );
      case 'NotificationOptIn':
        return (
          <>
            <Text style={styles.title}>Would you like to receive notifications?</Text>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </>
        );
      case 'PreferredReminderTime':
        return (
          <>
            <Text style={styles.title}>Choose your preferred reminder time</Text>
            <TouchableOpacity style={styles.button} onPress={() => router.replace('/login')}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </>
        );
      default:
        return <Text style={styles.title}>Unknown step</Text>;
    }
  };

  return <View style={styles.container}>{renderStep()}</View>;
}
