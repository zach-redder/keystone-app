import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import React, { useRef, useEffect } from 'react';
import { styles, width } from '../../styles/onboarding';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';
import BackArrow from './BackArrow';
import ProgressBar from './ProgressBar';

export default function OnboardingStep() {
  const { step } = useLocalSearchParams();
  const router = useRouter();

  const nextStepMap = {
    Welcome: 'Explanation',
    Explanation: 'UserInteraction',
    UserInteraction: 'DefineIdentity',
    DefineIdentity: 'ReceiveReminders',
    ReceiveReminders: 'LogActions',
    LogActions: 'AffirmVision',
    AffirmVision: 'login', 
  };

  const scaleValue = useRef(new Animated.Value(1)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [step]);

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/onboarding/${nextStep}`);
    }
  };

  const handleButtonPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
            <Text style={styles.title}>Welcome to Keystone</Text>
            <Text style={styles.subtitle}>You just chose to overcome internal tension and doubt.</Text>
            <Animated.View style={{ alignItems: 'center', transform: [{ scale: scaleValue }] }}>
              <Animated.View style={{ transform: [{ scale: pulseValue }] }}>
                <TouchableOpacity
                  style={styles.glowingButton}
                  onPress={handleButtonPress}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                >
                  <Text style={styles.buttonText}>Get Started</Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </View>
        );
      case 'Explanation':
        return (
          <View style={styles.container}>
            <BackArrow />
            <ProgressBar />
            <Image source={require('../../assets/keystone.png')} style={styles.aiImage} />
            <Text style={styles.title}>AI-Powered Experience</Text>
            <Text style={styles.subtitle}>
              Keystone is powered by AI to provide individualized support to keep you aligned.
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        );
      case 'UserInteraction':
        return (
          <View style={styles.container}>
            <BackArrow />
            <ProgressBar />
            <Image source={require('../../assets/keystone.png')} style={styles.aiImage} />
            <Text style={styles.title}>Engage with Keystone</Text>
            <Text style={styles.subtitle}>
              Enter your values, talk with AI, affirm your vision, log actions, and receive daily reminders.
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        );
      case 'DefineIdentity':
        return (
          <View style={styles.container}>
            <BackArrow />
            <ProgressBar />
            <Image source={require('../../assets/keystone.png')} style={styles.featureImage} />
            <Text style={styles.title}>Define Your Identity</Text>
            <Text style={styles.subtitle}>Placeholder text for defining identity.</Text>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        );
      case 'ReceiveReminders':
        return (
          <View style={styles.container}>
            <BackArrow />
            <ProgressBar />
            <Image source={require('../../assets/keystone.png')} style={styles.featureImage} />
            <Text style={styles.title}>Receive Reminders</Text>
            <Text style={styles.subtitle}>Placeholder text for receiving reminders.</Text>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        );
      case 'LogActions':
        return (
          <View style={styles.container}>
            <BackArrow />
            <ProgressBar />
            <Image source={require('../../assets/keystone.png')} style={styles.featureImage} />
            <Text style={styles.title}>Log Actions</Text>
            <Text style={styles.subtitle}>Placeholder text for logging actions.</Text>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        );
      case 'AffirmVision':
        return (
          <View style={styles.container}>
            <BackArrow />
            <ProgressBar />
            <Image source={require('../../assets/keystone.png')} style={styles.featureImage} />
            <Text style={styles.title}>Affirm Your Vision</Text>
            <Text style={styles.subtitle}>Placeholder text for affirming vision.</Text>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return <Text style={styles.title}>Unknown step</Text>;
    }
  };

  return <View style={styles.container}>{renderStep()}</View>;
}