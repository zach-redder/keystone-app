import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import React, { useRef, useEffect, useState  } from 'react';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import OnboardingHeader from './OnboardingHeader';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

export default function OnboardingStep() {

  const { step } = useLocalSearchParams();
  const router = useRouter();

  const [selectedOption, setSelectedOption] = useState(null);
  const [preferences, setPreferences] = useState({
    timezone: 'UTC',
    notification_opt_in: true,
    preferred_reminder_time: '09:00:00',
    preferred_ai_persona: 'gentle',
  });

  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationX > 50) {
        handleBack();
      }
    });

    const handleBack = () => {
      const prevStep = getPreviousStep(step);
      if (prevStep) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/onboarding/${prevStep}`);
      }
    };

    const getPreviousStep = (currentStep) => {
      const stepIndex = steps.indexOf(currentStep);
      return stepIndex > 0 ? steps[stepIndex - 1] : null;
    };

  const nextStepMap = {
    FutureSelfVision: 'LifeGoals',
    LifeGoals: 'CoreValues',
    CoreValues: 'AIPersonality',
    AIPersonality: 'NotificationOptIn',
    NotificationOptIn: 'NotificationTime', 
    NotificationTime: '../login',
  };

  const descriptions = {
    'Gentle Guide': "Kind and encouraging. Offers gentle support when you need it most.",
    'Honest Mentor': "Direct but caring. Tells the truth with respect and helps you grow with clarity.",
    'Accountability Partner': "Supportive and steady. Keeps you focused, reminds you what you said you'd do.",
    'Drill Sergeant': "No excuses. Sharp, intense, and built to push you beyond your limits.",
  };

  const scaleValue = useRef(new Animated.Value(1)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.05,
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
    console.log('Current step:', step);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Button Pressed');
    handleNext();
  };

  const handlePersonalitySelect = (personality) => {
    preferences.preferred_ai_persona = personality;
    setSelectedOption(personality);
    console.log('Selected AI Personality:', preferences.preferred_ai_persona);
  };

  const renderStep = () => {
    switch (step) {
      case 'FutureSelfVision':
        return (
          <View style={styles.container}>
            <OnboardingHeader />
            <Text style={styles.title}>Future Self Vision</Text>
            <Text style={styles.subtitle}>Placeholder text for future self vision.</Text>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        );
      case 'LifeGoals':
        return (
          <View style={styles.container}>
            <OnboardingHeader />
            <Text style={styles.title}>Engage with Keystone</Text>
            <Text style={styles.subtitle}>
              Enter your values, talk with AI, affirm your vision, log actions, and receive daily reminders.
            </Text>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        );
      case 'CoreValues':
        return (
          <View style={styles.container}>
            <OnboardingHeader />
            <Text style={styles.title}>Define Your Identity</Text>
            <Text style={styles.subtitle}>Placeholder text for defining identity.</Text>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        );
      case 'AIPersonality':
        return (
          <View style={styles.container}>
            <OnboardingHeader />
            <Text style={styles.secondaryHeader}>Choose your AI personality.</Text>
            <View style={styles.buttonContainer}>
              {['Gentle Guide', 'Honest Mentor', 'Accountability Partner', 'Drill Sergeant'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={selectedOption === option ? styles.selectedOptionButton : styles.optionButton}
                  onPress={() => handlePersonalitySelect(option)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.description}>
              {descriptions[selectedOption] || 'Select an option to see the description.'}
            </Text>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        );
      case 'NotificationOptIn':
        return (
          <View style={styles.container}>
            <OnboardingHeader />
            <Text style={styles.title}>Log Actions</Text>
            <Text style={styles.subtitle}>Placeholder text for logging actions.</Text>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        );
      case 'NotificationTime':
        return (
          <View style={styles.container}>
            <OnboardingHeader />
            <Text style={styles.title}>Notification Time</Text>
            <Text style={styles.subtitle}>When should your AI remind you?</Text>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.buttonText}>Finish</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return <Text style={styles.title}>Unknown step</Text>;
    }
  };

  return (      
    <GestureDetector gesture={swipeGesture}>
      <View style={styles.container}>
        <OnboardingHeader />
        {renderStep()}
      </View>
    </GestureDetector>
  );
}