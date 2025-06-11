import { useRouter,useLocalSearchParams } from 'expo-router';
import { View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import React, { useRef } from 'react';
import { styles, width } from '../../styles/onboarding';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';

export default function OnboardingStep() {
  const { step } = useLocalSearchParams();
  const router = useRouter();

  const nextStepMap = {
    Welcome: 'PreferredAIPersona',
    PreferredAIPersona: 'NotificationOptIn',
    NotificationOptIn: 'PreferredReminderTime',
    PreferredReminderTime: 'login',
  };

  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleNext = () => {
    const nextStep = nextStepMap[step];
    if (nextStep) {
      router.replace(`/onboarding/${nextStep}`);
    }
  };

  const handleButtonPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Trigger a subtle haptic feedback
    console.log('Button Pressed');
    handleNext();
  };

  const renderStep = () => {
    switch (step) {
      case 'Welcome':
        return (
          <View style={styles.container}>
            <ConfettiCannon
              count={200}
              origin={{ x: (width / 2) - 50, y: -50 }}
              fallSpeed={3000}
              explosionSpeed={1000}
              fadeOut={true}
            />
            <View style={styles.gradientBg} />
            <View style={styles.logoWrapper}>
              <Image source={require('../../assets/keystone_transparent.png')} style={styles.logo} />
            </View>
            <Text style={styles.title}>Welcome!</Text>
            <Text style={styles.subtitle}>You just chose to stop living for others.</Text>
            <Animated.View style={{ alignItems: 'center', transform: [{ scale: scaleValue }] }}>
              <TouchableOpacity
                style={styles.button}
                onPress={handleButtonPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              >
                <Text style={styles.buttonText}>Get Started</Text>
              </TouchableOpacity>
            </Animated.View>
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
