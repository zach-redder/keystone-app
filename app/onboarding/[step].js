import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, TouchableOpacity, Animated, TextInput } from 'react-native';
import React, { useRef, useEffect, useState } from 'react';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import OnboardingProgressHeader from './OnboardingProgressHeader';
import { Gesture, GestureDetector, ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import CustomTimePicker from './CustomTimePicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function OnboardingStep() {

  const { step } = useLocalSearchParams();
  const router = useRouter();
  const verticalScrollRef = useRef(null);
  const [time, setTime] = useState(new Date());
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputValue, setCustomInputValue] = useState('');

  const steps = [
    'FutureSelfVision',
    'LifeGoals',
    'CoreValues'
    // Removed: 'AIPersonality', 'NotificationOptIn', 'NotificationTime'
  ];

  const [selectedOptions, setSelectedOptions] = useState([]);
  const [preferences, setPreferences] = useState({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notification_opt_in: true,
    preferred_reminder_time: '12:00:00',
    preferred_ai_persona: 'Gentle Guide',
  });

  const [customOptions, setCustomOptions] = useState([]);

  // Load preferences from AsyncStorage on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // Clear previous step data
        setSelectedOptions([]);
        setCustomOptions([]);
        
        const savedPrefs = await AsyncStorage.getItem('user_preferences');
        if (savedPrefs) {
          setPreferences(JSON.parse(savedPrefs));
        }

        // Load saved selections for the current step
        let stepKey;
        if (step === 'FutureSelfVision') {
          stepKey = 'future_self_vision';
        } else if (step === 'LifeGoals') {
          stepKey = 'life_goals';
        } else if (step === 'CoreValues') {
          stepKey = 'core_values';
        } else if (step === 'AIPersonality') {
          stepKey = 'ai_personality';
        }

        if (stepKey) {
          const savedSelections = await AsyncStorage.getItem(stepKey);
          const savedCustomOptions = await AsyncStorage.getItem(`${step.toLowerCase()}_custom_options`);
          
          if (savedSelections) {
            setSelectedOptions(JSON.parse(savedSelections));
          }
          
          if (savedCustomOptions) {
            setCustomOptions(JSON.parse(savedCustomOptions));
          }
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };
    loadPreferences();
  }, [step]);

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
    CoreValues: '/onboarding/Animation'
  };

  const descriptions = {
    'Gentle Guide': "Kind and encouraging. Offers gentle support when you need it most.",
    'Supportive Friend': "Direct but caring with steady accountability keeping you focused.",
    'Disciplined Mentor': "No excuses. Sharp, intense, and built to push you beyond your limits.",
  };

  // Add a mapping for display labels
  const personaOptions = [
    {
      value: 'Gentle Guide',
      label: 'Gentle Guide: Kind and encouraging. Offers gentle support when you need it most.'
    },
    {
      value: 'Supportive Friend',
      label: 'Supportive Friend: Direct but caring with steady accountability keeping you focused.'
    },
    {
      value: 'Disciplined Mentor',
      label: 'Disciplined Mentor: No excuses. Sharp, intense, and built to push you beyond your limits.'
    }
  ];

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
          console.log('Saving FutureSelfVision selections:', selectedOptions);
          await AsyncStorage.setItem('future_self_vision', JSON.stringify(selectedOptions));
        } else if (step === 'LifeGoals') {
          console.log('Saving LifeGoals selections:', selectedOptions);
          await AsyncStorage.setItem('life_goals', JSON.stringify(selectedOptions));
        } else if (step === 'CoreValues') {
          console.log('Saving CoreValues selections:', selectedOptions);
          await AsyncStorage.setItem('core_values', JSON.stringify(selectedOptions));
        } else if (step === 'AIPersonality') {
          console.log('Saving AIPersonality selections:', selectedOptions);
          await AsyncStorage.setItem('ai_personality', JSON.stringify(selectedOptions));
        }
        
        // Also save any custom options that were added
        if (customOptions.length > 0) {
          console.log('Saving custom options for', step, ':', customOptions);
          await AsyncStorage.setItem(`${step.toLowerCase()}_custom_options`, JSON.stringify(customOptions));
        }
      } catch (error) {
        console.error('Error saving selections:', error);
      }
      
      // If this is the last step, save final preferences
      if (nextStep === '/register') {
        console.log('Saving final preferences before registration:', preferences);
        await AsyncStorage.setItem('final_preferences', JSON.stringify(preferences));
        
        // Debug: Let's also check what's currently in AsyncStorage
        const debugData = {
          future_self_vision: await AsyncStorage.getItem('future_self_vision'),
          life_goals: await AsyncStorage.getItem('life_goals'),
          core_values: await AsyncStorage.getItem('core_values'),
          ai_personality: await AsyncStorage.getItem('ai_personality'),
        };
        console.log('Current AsyncStorage data before registration:', debugData);
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
    let saveValue = personality;
    if (personality === 'Disciplined Mentor') {
      saveValue = 'Disciplined Mentor: No excuses. Sharp, intense, and built to push you beyond your limits.';
    }
    if (personality === 'Gentle Guide') {
      saveValue = 'Gentle Guide: Kind and encouraging. Offers gentle support when you need it most.';
    }
    if (personality === 'Supportive Friend') {
      saveValue = 'Supportive Friend: Direct but caring with steady accountability keeping you focused.';
    }
    setPreferences(prev => ({
      ...prev,
      preferred_ai_persona: saveValue,
    }));
    setSelectedOptions([personality]);
    try {
      AsyncStorage.setItem('ai_personality', JSON.stringify([saveValue]));
      console.log('Saved AI personality to AsyncStorage:', [saveValue]);
    } catch (error) {
      console.error('Error saving AI personality:', error);
    }
  };

  const toggleOption = (option) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedOptions((prevSelected) => {
      if (prevSelected.includes(option)) {
        return prevSelected.filter((item) => item !== option);
      } else if (prevSelected.length < 5) {
        return [...prevSelected, option];
      }
      return prevSelected;
    });
  };

  const handleCustomInputSubmit = () => {
    if (customInputValue.trim()) {
      const newOption = customInputValue.trim();
      setCustomOptions(prev => [...prev, newOption]);
      toggleOption(newOption);
      setCustomInputValue('');
      setShowCustomInput(false);
    }
  };

  const handleShowCustomInput = () => {
    setShowCustomInput(true);
  };

  const renderCustomSection = () => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>Custom</Text>
        <View style={styles.customOptionsRow}>
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
            <View style={[styles.customInputContainer, { minWidth: Math.max(100, customInputValue.length * 8 + 20) }]}>
              <TextInput
                style={[styles.customInput, { width: Math.max(100, customInputValue.length * 8 + 20) }]}
                value={customInputValue}
                onChangeText={setCustomInputValue}
                placeholder="Enter..."
                placeholderTextColor="#808080"
                onSubmitEditing={handleCustomInputSubmit}
                autoFocus
                inputAccessoryViewID={null}
                autoComplete="off"
                autoCorrect={false}
                spellCheck={false}
                multiline={false}
                maxLength={30}
              />
            </View>
          ) : null}
          <TouchableOpacity
            style={styles.addCustomButton}
            onPress={handleShowCustomInput}
          >
            <Text style={styles.addCustomButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 'FutureSelfVision':
        return (
          <LinearGradient
                            colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <OnboardingProgressHeader />
            <Text style={styles.selfVisionTitle}>Fast forward 10 years.</Text>
            <Text style={styles.selfVisionSubtitle}>Who do you wish to be?</Text>
            <Text style={styles.selfVisionDescription}>Select up to 5.</Text>
            <GestureScrollView 
              style={{ flex: 1, width: '100%' }}
              keyboardShouldPersistTaps="handled"
            >
              {renderCustomSection()}
              {/* <View style={styles.categoryContainer}>
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
              </View> */}
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>Career</Text>
                <GestureScrollView 
                  horizontal 
                  style={styles.scrollView}
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
            </GestureScrollView>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </LinearGradient>
        );        
        case 'LifeGoals':
          return (
            <LinearGradient
                              colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
              style={styles.gradientContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <OnboardingProgressHeader />
              <Text style={styles.selfVisionTitle}>You have big goals.</Text>
              <Text style={styles.selfVisionSubtitle}>What are they?</Text>
              <Text style={styles.selfVisionDescription}>Select up to 5.</Text>
              <GestureScrollView 
                style={{ flex: 1, width: '100%' }}
                keyboardShouldPersistTaps="handled"
              >
                {renderCustomSection()}
                {/* <View style={styles.categoryContainer}>
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
                </View> */}
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
              </GestureScrollView>
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            </LinearGradient>
          );
      case 'CoreValues':
        return (
          <LinearGradient
                            colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <OnboardingProgressHeader />
            <Text style={styles.selfVisionTitle}>Values define you.</Text>
            <Text style={styles.selfVisionSubtitle}>What should people notice in you?</Text>
            <Text style={styles.selfVisionDescription}>Select up to 5.</Text>
            <GestureScrollView 
              style={{ flex: 1, width: '100%' }}
              keyboardShouldPersistTaps="handled"
            >
              {renderCustomSection()}
              {/* <View style={styles.categoryContainer}>
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
              </View> */}
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
            </GestureScrollView>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </LinearGradient>
        );
      case 'AIPersonality':
        return (
          <View style={styles.container}>
             <OnboardingHeader />
             <Text style={styles.secondaryHeader}>Choose your AI personality.</Text>
             <View style={styles.buttonContainer}>
               {personaOptions.map((option) => (
                 <TouchableOpacity
                   key={option.value}
                   style={selectedOptions.includes(option.value) ? styles.selectedOptionButton : styles.optionButton}
                   onPress={() => handlePersonalitySelect(option.value)}
                 >
                   <Text style={styles.optionText}>{option.value}</Text>
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
            <Text style={styles.reminderTimeHeader}>When should your AI send a reminder?</Text>
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
      {renderStep()}
    </GestureDetector>
  );
}