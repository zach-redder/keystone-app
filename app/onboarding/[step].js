import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, TouchableOpacity, Animated, ScrollView } from 'react-native';
import React, { useRef, useEffect, useState  } from 'react';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import OnboardingHeader from './OnboardingHeader';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import CustomTimePicker from './CustomTimePicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnboardingStep() {

  const { step } = useLocalSearchParams();
  const router = useRouter();
  const [time, setTime] = useState(new Date());

  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setTime(currentTime);
    // Update preferences or state with the selected time
    setPreferences((prev) => ({
      ...prev,
      preferred_reminder_time: currentTime.toTimeString().slice(0, 8),
    }));
  };

  const [selectedOptions, setSelectedOptions] = useState([]);
  const [preferences, setPreferences] = useState({
    timezone: 'UTC',
    notification_opt_in: true,
    preferred_reminder_time: '09:00:00',
    preferred_ai_persona: 'gentle',
  });

  const [notificationPermissionShown, setNotificationPermissionShown] = useState(false);

  useEffect(() => {
    const checkPermissionShown = async () => {
      const shown = await AsyncStorage.getItem('notificationPermissionShown');
      if (shown) {
        setNotificationPermissionShown(true);
      }
    };

    checkPermissionShown();
  }, []);

  useEffect(() => {
    if (step === 'NotificationOptIn' && !notificationPermissionShown) {
      const askPermission = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }
        await AsyncStorage.setItem('notificationPermissionShown', 'true');
        setNotificationPermissionShown(true);
        handleNext();
      };

      askPermission();
    } else if (step === 'NotificationOptIn' && notificationPermissionShown) {
      handleNext(); // Skip the step if already shown
    }
  }, [step, notificationPermissionShown]);

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
    NotificationTime: '../register',
  };

  const descriptions = {
    'Gentle Guide': "Kind and encouraging. Offers gentle support when you need it most.",
    'Honest Mentor': "Direct but caring. Tells the truth with respect and helps you grow with clarity.",
    'Accountability Partner': "Supportive and steady. Keeps you focused, reminds you what you said you'd do.",
    'Drill Sergeant': "No excuses. Sharp, intense, and built to push you beyond your limits.",
  };

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

  const handleNext = () => {
    const nextStep = nextStepMap[step];
    if (nextStep) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/onboarding/${nextStep}`);
    }
  };

  const handlePersonalitySelect = (personality) => {
    preferences.preferred_ai_persona = personality;
    setSelectedOptions((prevSelected) => {
      if (prevSelected.includes(personality)) {
        return prevSelected.filter((item) => item !== personality);
      } else if (prevSelected.length < 5) {
        return [...prevSelected, personality];
      }
      return prevSelected;
    });
    console.log('Selected AI Personality:', preferences.preferred_ai_persona);
  };

  const toggleOption = (option) => {
    setSelectedOptions((prevSelected) => {
      if (prevSelected.includes(option)) {
        return prevSelected.filter((item) => item !== option);
      } else if (prevSelected.length < 5) {
        return [...prevSelected, option];
      }
      return prevSelected;
    });
  };

  const renderStep = () => {
    switch (step) {
      case 'FutureSelfVision':
        return (
          <View style={styles.container}>
            <OnboardingHeader />
            <Text style={styles.selfVisionTitle}>Fast forward 5 years.</Text>
            <Text style={styles.selfVisionSubtitle}>Who do you wish to be?</Text>
            <Text style={styles.selfVisionDescription}>Select up to 5.</Text>
            <View style={styles.separator} />
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryTitle}>Popular</Text>
              <ScrollView horizontal style={styles.scrollView}>
                <View style={styles.optionsContainer}>
                  {['Gym Goer', 'Software Developer', 'Runner', 'Business Owner', 'Athlete', 'Pastor', 'Engineer', 'Doctor', 'Artist', 'Lawyer'].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                      onPress={() => toggleOption(option)}
                    >
                      <Text style={styles.multiSelectButtonText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryTitle}>Career</Text>
              <View style={styles.optionsContainer}>
                {['Gym Goer', 'Software Developer', 'Runner', 'Business Owner', 'Athlete'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                    onPress={() => toggleOption(option)}
                  >
                    <Text style={styles.multiSelectButtonText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryTitle}>Fitness</Text>
              <View style={styles.optionsContainer}>
                {['Gym Goer', 'Software Developer', 'Runner', 'Business Owner', 'Athlete'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                    onPress={() => toggleOption(option)}
                  >
                    <Text style={styles.multiSelectButtonText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        );
      case 'LifeGoals':
        return (
          <View style={styles.container}>
            <OnboardingHeader />
            <Text style={styles.title}>Life Goals</Text>
            <Text style={styles.subtitle}>
              Placeholder text for life goals.
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
                   style={selectedOptions.includes(option) ? styles.selectedOptionButton : styles.optionButton}
                   onPress={() => handlePersonalitySelect(option)}
                 >
                   <Text style={styles.optionText}>{option}</Text>
                 </TouchableOpacity>
               ))}
             </View>
             <Text style={styles.description}>
               {descriptions[selectedOptions[0]] || 'Select an option to see the description.'}
             </Text>
             <TouchableOpacity
               style={selectedOptions.length > 0 ? styles.nextButton : styles.disabledButton}
               onPress={handleNext}
               disabled={selectedOptions.length === 0}
             >
               <Text style={styles.buttonText}>Next</Text>
             </TouchableOpacity>
           </View>
        );
      case 'NotificationOptIn':
        return (
          <View style={styles.container}>
            <OnboardingHeader />
            <Text style={styles.notificationHeader}>Daily reminders to keep you aligned.</Text>
            <View style={styles.notificationContainer} />
          </View>
        );
      case 'NotificationTime':
        return (
          <View style={styles.container}>
            <OnboardingHeader />
            <Text style={styles.reminderTimeHeader}>What time do you want to be reminded?</Text>
            <CustomTimePicker selectedTime={time} onTimeChange={onTimeChange} />
            <Animated.View style={{ transform: [{ scale: pulseValue }] }}>
              <TouchableOpacity style={styles.glowingButton} onPress={handleNext}>
                <Text style={styles.buttonText}>Finish</Text>
              </TouchableOpacity>
            </Animated.View>
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