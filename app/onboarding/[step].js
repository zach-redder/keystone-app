import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, TouchableOpacity, Animated, ScrollView, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import React, { useRef, useEffect, useState  } from 'react';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import OnboardingHeader from './OnboardingHeader';
import { Gesture, GestureDetector, ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import CustomTimePicker from './CustomTimePicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnboardingStep() {

  const { step } = useLocalSearchParams();
  const router = useRouter();
  const [time, setTime] = useState(new Date());
  const verticalScrollRef = useRef(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputValue, setCustomInputValue] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const steps = [
    'FutureSelfVision',
    'LifeGoals',
    'CoreValues',
    'AIPersonality',
    'NotificationOptIn',
    'NotificationTime'
  ];

  const [selectedOptions, setSelectedOptions] = useState([]);
  const [preferences, setPreferences] = useState({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notification_opt_in: true,
    preferred_reminder_time: '09:00:00',
    preferred_ai_persona: 'gentle',
  });

  const [customOptions, setCustomOptions] = useState([]);

  const horizontalScrollRef = useRef(null);
  const [contentWidth, setContentWidth] = useState(0);

  // Load preferences from AsyncStorage on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedPrefs = await AsyncStorage.getItem('user_preferences');
        if (savedPrefs) {
          setPreferences(JSON.parse(savedPrefs));
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  // Save preferences to AsyncStorage whenever they change
  useEffect(() => {
    const savePreferences = async () => {
      try {
        await AsyncStorage.setItem('user_preferences', JSON.stringify(preferences));
      } catch (error) {
        console.error('Error saving preferences:', error);
      }
    };
    savePreferences();
  }, [preferences]);

  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setTime(currentTime);
    setPreferences(prev => ({
      ...prev,
      preferred_reminder_time: currentTime.toTimeString().slice(0, 8),
    }));
  };

  const [notificationPermissionShown, setNotificationPermissionShown] = useState(false);

  useEffect(() => {
    if (step === 'NotificationOptIn' && !notificationPermissionShown) {
      const askPermission = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          const { status: newStatus } = await Notifications.requestPermissionsAsync();
          setPreferences(prev => ({
            ...prev,
            notification_opt_in: newStatus === 'granted',
          }));
        }
        await AsyncStorage.setItem('notificationPermissionShown', 'true');
        setNotificationPermissionShown(true);
        handleNext();
      };

      askPermission();
    }
  }, [step, notificationPermissionShown]);

  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationX > 50) {
        handleBack();
      }
    });

  const nextStepMap = {
    FutureSelfVision: '/onboarding/LifeGoals',
    LifeGoals: '/onboarding/CoreValues',
    CoreValues: '/onboarding/AIPersonality',
    AIPersonality: '/onboarding/NotificationOptIn',
    NotificationOptIn: '/onboarding/NotificationTime',
    NotificationTime: '/register',
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

  const handleNext = async () => {
    const nextStep = nextStepMap[step];
    if (nextStep) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Save the current step's selections to AsyncStorage
      try {
        if (step === 'FutureSelfVision') {
          await AsyncStorage.setItem('future_self_vision', JSON.stringify(selectedOptions));
        } else if (step === 'LifeGoals') {
          await AsyncStorage.setItem('life_goals', JSON.stringify(selectedOptions));
        } else if (step === 'CoreValues') {
          await AsyncStorage.setItem('core_values', JSON.stringify(selectedOptions));
        }
      } catch (error) {
        console.error('Error saving selections:', error);
      }
      
      // If this is the last step, save final preferences
      if (nextStep === '/register') {
        await AsyncStorage.setItem('final_preferences', JSON.stringify(preferences));
      }
      
      router.push(nextStep);
    }
  };

  const handleBack = () => {
    const prevStep = getPreviousStep(step);
    if (prevStep) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/onboarding/${prevStep}`);
    }
  };

  const getPreviousStep = (currentStep) => {
    const stepIndex = steps.indexOf(currentStep);
    if (currentStep === 'NotificationTime') {
      return 'AIPersonality'; // Skip NotificationOptIn when going back
    }
    return stepIndex > 0 ? steps[stepIndex - 1] : null;
  };

  const handlePersonalitySelect = (personality) => {
    setPreferences(prev => ({
      ...prev,
      preferred_ai_persona: personality.toLowerCase().replace(' ', '_'),
    }));
    setSelectedOptions([personality]);
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

  useEffect(() => {
    const keyboardWillShow = (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    };

    const keyboardWillHide = () => {
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      keyboardWillShow
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      keyboardWillHide
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleCustomInputSubmit = () => {
    if (customInputValue.trim()) {
      const newOption = customInputValue.trim();
      setCustomOptions(prev => [...prev, newOption]);
      toggleOption(newOption);
      setCustomInputValue('');
      setShowCustomInput(false);
      Keyboard.dismiss();
    }
  };

  const handleShowCustomInput = () => {
    setShowCustomInput(true);
    // Wait for the input to render and then scroll
    setTimeout(() => {
      if (horizontalScrollRef.current) {
        horizontalScrollRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  const handleLayout = (event) => {
    setContentWidth(event.nativeEvent.layout.width);
  };

  const renderCustomSection = () => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>Custom</Text>
      <GestureScrollView 
        ref={horizontalScrollRef}
        horizontal 
        style={styles.scrollView}
        simultaneousHandlers={verticalScrollRef}
      >
        <View 
          style={styles.customOptionsRow}
          onLayout={handleLayout}
        >
          {customOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
              onPress={() => toggleOption(option)}
            >
              <Text style={styles.multiSelectButtonText}>{option}</Text>
            </TouchableOpacity>
          ))}
          {showCustomInput ? (
            <View style={styles.customInputContainer}>
              <TextInput
                style={styles.customInput}
                value={customInputValue}
                onChangeText={setCustomInputValue}
                placeholder="Type here..."
                placeholderTextColor="#808080"
                onSubmitEditing={handleCustomInputSubmit}
                autoFocus
                returnKeyType="done"
              />
            </View>
          ) : null}
          <TouchableOpacity
            style={styles.addCustomButton}
            onPress={handleShowCustomInput}
          >
            <Text style={styles.addCustomButtonText}>+  Add</Text>
          </TouchableOpacity>
        </View>
      </GestureScrollView>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 'FutureSelfVision':
        return (
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { paddingBottom: keyboardHeight }]}
          >
            <OnboardingHeader />
            <Text style={styles.selfVisionTitle}>Fast forward 10 years.</Text>
            <Text style={styles.selfVisionSubtitle}>Who do you wish to be?</Text>
            <Text style={styles.selfVisionDescription}>Select up to 5.</Text>
            <GestureScrollView 
              ref={verticalScrollRef}
              style={{ flex: 1, width: '100%' }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>Popular</Text>
                <GestureScrollView 
                  horizontal 
                  style={styles.scrollView}
                  simultaneousHandlers={verticalScrollRef}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 800 }]}>
                    {['Gym Goer', 'Business Owner', 'Software Developer', 'Runner', 'Professional Athlete', 'Pastor', 'Engineer', 'Doctor', 'Lawyer', 'Parent', 'Grandparent', 'Traveler'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                      >
                        <Text style={styles.multiSelectButtonText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </GestureScrollView>
              </View>
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>Career</Text>
                <GestureScrollView 
                  horizontal 
                  style={styles.scrollView}
                  simultaneousHandlers={verticalScrollRef}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 800 }]}>
                    {['Software Developer', 'Business Owner', 'Pastor', 'Engineer', 'Doctor', 'Artist', 'Lawyer', 'Nurse', 'Personal Trainer', 'Influencer', 'Therapist', 'Writer', 'Chef'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                      >
                        <Text style={styles.multiSelectButtonText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </GestureScrollView>
              </View>
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>Fitness</Text>
                <GestureScrollView 
                  horizontal 
                  style={styles.scrollView}
                  simultaneousHandlers={verticalScrollRef}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 500 }]}>
                    {['Gym Goer', 'Runner', 'Professional Athlete', 'Power Lifter', 'Bodybuilder', 'Boxer'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                      >
                        <Text style={styles.multiSelectButtonText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </GestureScrollView>
              </View>
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>Family</Text>
                <GestureScrollView 
                  horizontal 
                  style={styles.scrollView}
                  simultaneousHandlers={verticalScrollRef}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 500 }]}>
                    {['Father', 'Mother', 'Grandparent', 'Pet Owner', 'Husband', 'Wife', 'Adoptive Parent', 'Parent'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                      >
                        <Text style={styles.multiSelectButtonText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </GestureScrollView>
              </View>
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>Lifestyle</Text>
                <GestureScrollView 
                  horizontal 
                  style={styles.scrollView}
                  simultaneousHandlers={verticalScrollRef}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 400 }]}>
                    {['Traveler', 'Soloprenuer', 'Freelancer', 'Minimalist', 'Stoic', 'Mindful'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                      >
                        <Text style={styles.multiSelectButtonText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </GestureScrollView>
              </View>
              {renderCustomSection()}
            </GestureScrollView>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        );
      case 'LifeGoals':
        return (
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { paddingBottom: keyboardHeight }]}
          >
            <OnboardingHeader />
            <Text style={styles.selfVisionTitle}>You have big goals.</Text>
            <Text style={styles.selfVisionSubtitle}>What are they?</Text>
            <Text style={styles.selfVisionDescription}>Select up to 5.</Text>
            <GestureScrollView 
              ref={verticalScrollRef}
              style={{ flex: 1, width: '100%' }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>Popular</Text>
                <GestureScrollView 
                  horizontal 
                  style={styles.scrollView}
                  simultaneousHandlers={verticalScrollRef}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 900 }]}>
                    {['Millionaire', 'Freedom', 'Have Family', 'Travel World', 'Write Book', 'Own House', 'Get Married', 'Own Business', 'Dream Car', 'Bench 315', 'Retire Parents', 'Run Ultra', 'Six Pack Abs'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                      >
                        <Text style={styles.multiSelectButtonText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </GestureScrollView>
              </View>
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>Career</Text>
                <GestureScrollView 
                  horizontal 
                  style={styles.scrollView}
                  simultaneousHandlers={verticalScrollRef}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 600 }]}>
                    {['Own Business', 'Top Executive', 'Six Figure Income', 'Work Remote', 'Millionaire', 'Generational Wealth', 'Top Investor'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                      >
                        <Text style={styles.multiSelectButtonText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </GestureScrollView>
              </View>
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>Fitness</Text>
                <GestureScrollView 
                  horizontal 
                  style={styles.scrollView}
                  simultaneousHandlers={verticalScrollRef}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 500 }]}>
                    {['Run Marathon', 'Six Pack Abs', 'Bench 315', 'Squat 405', 'Deadlift 495', 'Run Ultra'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                      >
                        <Text style={styles.multiSelectButtonText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </GestureScrollView>
              </View>
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>Family</Text>
                <GestureScrollView 
                  horizontal 
                  style={styles.scrollView}
                  simultaneousHandlers={verticalScrollRef}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 500 }]}>
                    {['Get Married', 'Have Family', 'Own House', 'Retire Parents', 'Family Vacation Home'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                      >
                        <Text style={styles.multiSelectButtonText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </GestureScrollView>
              </View>
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>Lifestyle</Text>
                <GestureScrollView 
                  horizontal 
                  style={styles.scrollView}
                  simultaneousHandlers={verticalScrollRef}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 500 }]}>
                    {['Travel World', 'Live Abroad', 'Learn Language', 'Write Book', 'Start Podcast', 'Learn Instrument'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                      >
                        <Text style={styles.multiSelectButtonText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </GestureScrollView>
              </View>
              {renderCustomSection()}
            </GestureScrollView>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        );
      case 'CoreValues':
        return (
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { paddingBottom: keyboardHeight }]}
          >
            <OnboardingHeader />
            <Text style={styles.selfVisionTitle}>Values define you.</Text>
            <Text style={styles.selfVisionSubtitle}>What should people notice in you?</Text>
            <Text style={styles.selfVisionDescription}>Select up to 5.</Text>
            <GestureScrollView 
              ref={verticalScrollRef}
              style={{ flex: 1, width: '100%' }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>Popular</Text>
                <GestureScrollView 
                  horizontal 
                  style={styles.scrollView}
                  simultaneousHandlers={verticalScrollRef}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 700 }]}>
                    {['Purpose', 'Success', 'Love', 'Health', 'Ambition', 'Balance', 'Wisdom', 'Legacy', 'Creativity', 'Leadership', 'Compassion', 'Focus'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                      >
                        <Text style={styles.multiSelectButtonText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </GestureScrollView>
              </View>
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>Career</Text>
                <GestureScrollView 
                  horizontal 
                  style={styles.scrollView}
                  simultaneousHandlers={verticalScrollRef}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 700 }]}>
                    {['Mastery', 'Ambition', 'Success', 'Legacy', 'Purpose', 'Wisdom', 'Innovation', 'Curiosity', 'Balance', 'Leadership', 'Influence'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                      >
                        <Text style={styles.multiSelectButtonText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </GestureScrollView>
              </View>
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>Fitness</Text>
                <GestureScrollView 
                  horizontal 
                  style={styles.scrollView}
                  simultaneousHandlers={verticalScrollRef}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 700 }]}>
                    {['Health', 'Strength', 'Speed', 'Endurance', 'Flexibility', 'Balance', 'Agility', 'Coordination', 'Power', 'Stamina', 'Focus', 'Perseverance'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                      >
                        <Text style={styles.multiSelectButtonText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </GestureScrollView>
              </View>
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>Family</Text>
                <GestureScrollView 
                  horizontal 
                  style={styles.scrollView}
                  simultaneousHandlers={verticalScrollRef}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 650 }]}>
                    {['Love', 'Kindness', 'Compassion', 'Joy', 'Loyalty', 'Dependability', 'Support', 'Patience','Listening', 'Forgiveness', 'Inclusivity'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                      >
                        <Text style={styles.multiSelectButtonText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </GestureScrollView>
              </View>
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>Lifestyle</Text>
                <GestureScrollView 
                  horizontal 
                  style={styles.scrollView}
                  simultaneousHandlers={verticalScrollRef}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 600 }]}>
                    {['Open-Minded', 'Faith', 'Peace', 'Stability', 'Intentionality', 'Creativity', 'Self-Care', 'Longevity', 'Aesthetics'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                      >
                        <Text style={styles.multiSelectButtonText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </GestureScrollView>
              </View>
              {renderCustomSection()}
            </GestureScrollView>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
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