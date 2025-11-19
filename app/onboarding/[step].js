import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, TouchableOpacity, Animated, TextInput } from 'react-native';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import OnboardingProgressHeader from './OnboardingProgressHeader';
import OnboardingHeader from './OnboardingHeader';
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

  // Debounced save function to prevent race conditions
  const debouncedSave = useCallback(
    (() => {
      let timeoutId;
      return (key, data) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          try {
            await AsyncStorage.setItem(key, JSON.stringify(data));
          } catch (error) {
            console.error('Error saving to AsyncStorage:', error);
          }
        }, 100);
      };
    })(),
    []
  );

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
    debouncedSave('user_preferences', preferences);
  }, [preferences, debouncedSave]);

  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setTime(currentTime);
    setPreferences(prev => ({
      ...prev,
      preferred_reminder_time: currentTime.toTimeString().slice(0, 8),
    }));
  };

  const askPermission = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    }
  };

  const handleNext = async () => {
    try {
      // Haptic feedback for Next button
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Save current step selections
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
        await AsyncStorage.setItem(stepKey, JSON.stringify(selectedOptions));
        await AsyncStorage.setItem(`${step.toLowerCase()}_custom_options`, JSON.stringify(customOptions));
      }

      const currentIndex = steps.indexOf(step);
      if (currentIndex < steps.length - 1) {
        router.push(`/onboarding/${steps[currentIndex + 1]}`);
      } else {
        // After CoreValues (last step), go to Progress
        router.push('/onboarding/Progress');
      }
    } catch (error) {
      console.error('Error in handleNext:', error);
    }
  };

  const handleBack = () => {
    try {
      const currentIndex = steps.indexOf(step);
      if (currentIndex > 0) {
        router.push(`/onboarding/${steps[currentIndex - 1]}`);
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Error in handleBack:', error);
    }
  };

  const getPreviousStep = (currentStep) => {
    const currentIndex = steps.indexOf(currentStep);
    return currentIndex > 0 ? steps[currentIndex - 1] : null;
  };

  const handlePersonalitySelect = (personality) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const saveValue = personality;
      setSelectedOptions([personality]);
      debouncedSave('ai_personality', [saveValue]);
      console.log('Saved AI personality to AsyncStorage:', [saveValue]);
    } catch (error) {
      console.error('Error saving AI personality:', error);
    }
  };

  const toggleOption = useCallback((option) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedOptions((prevSelected) => {
        if (prevSelected.includes(option)) {
          return prevSelected.filter((item) => item !== option);
        } else {
          return [...prevSelected, option];
        }
        return prevSelected;
      });
    } catch (error) {
      console.error('Error in toggleOption:', error);
    }
  }, []);

  const handleCustomInputSubmit = () => {
    try {
      if (customInputValue.trim()) {
        const newOption = customInputValue.trim();
        setCustomOptions(prev => [...prev, newOption]);
        toggleOption(newOption);
        setCustomInputValue('');
        setShowCustomInput(false);
      }
    } catch (error) {
      console.error('Error in handleCustomInputSubmit:', error);
    }
  };

  const handleShowCustomInput = () => {
    try {
      setShowCustomInput(true);
    } catch (error) {
      console.error('Error in handleShowCustomInput:', error);
    }
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
              activeOpacity={0.7}
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
            activeOpacity={0.7}
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
            <GestureScrollView 
              style={{ flex: 1, width: '100%' }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {renderCustomSection()}
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>Career</Text>
                <GestureScrollView 
                  horizontal 
                  style={styles.scrollView}
                  showsHorizontalScrollIndicator={false}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 800 }]}>
                    {['Software Developer', 'Business Owner', 'Pastor', 'Engineer', 'Doctor', 'Artist', 'Lawyer', 'Nurse', 'Personal Trainer', 'Influencer', 'Therapist', 'Writer', 'Chef'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                        activeOpacity={0.7}
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
                  showsHorizontalScrollIndicator={false}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 500 }]}>
                    {['Gym Goer', 'Runner', 'Professional Athlete', 'Power Lifter', 'Bodybuilder', 'Boxer'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                        activeOpacity={0.7}
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
                  showsHorizontalScrollIndicator={false}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 500 }]}>
                    {['Father', 'Mother', 'Grandparent', 'Pet Owner', 'Husband', 'Wife', 'Adoptive Parent', 'Parent'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                        activeOpacity={0.7}
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
                  showsHorizontalScrollIndicator={false}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 400 }]}>
                    {['Traveler', 'Soloprenuer', 'Freelancer', 'Minimalist', 'Stoic', 'Mindful'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                        activeOpacity={0.7}
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
                    showsHorizontalScrollIndicator={false}
                  >
                    <View style={[styles.optionsContainer, { maxWidth: 500 }]}>
                      {['Get Married', 'Have Family', 'Own House', 'Retire Parents', 'Family Vacation Home'].map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                          onPress={() => toggleOption(option)}
                          activeOpacity={0.7}
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
                    showsHorizontalScrollIndicator={false}
                  >
                    <View style={[styles.optionsContainer, { maxWidth: 500 }]}>
                      {['Travel World', 'Live Abroad', 'Learn Language', 'Write Book', 'Start Podcast', 'Learn Instrument'].map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                          onPress={() => toggleOption(option)}
                          activeOpacity={0.7}
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
                  showsHorizontalScrollIndicator={false}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 700 }]}>
                    {['Mastery', 'Ambition', 'Success', 'Legacy', 'Purpose', 'Wisdom', 'Innovation', 'Curiosity', 'Balance', 'Leadership', 'Influence'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                        activeOpacity={0.7}
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
                  showsHorizontalScrollIndicator={false}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 700 }]}>
                    {['Health', 'Strength', 'Speed', 'Endurance', 'Flexibility', 'Balance', 'Agility', 'Coordination', 'Power', 'Stamina', 'Focus', 'Perseverance'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                        activeOpacity={0.7}
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
                  showsHorizontalScrollIndicator={false}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 650 }]}>
                    {['Love', 'Kindness', 'Compassion', 'Joy', 'Loyalty', 'Dependability', 'Support', 'Patience','Listening', 'Forgiveness', 'Inclusivity'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                        activeOpacity={0.7}
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
                  showsHorizontalScrollIndicator={false}
                >
                  <View style={[styles.optionsContainer, { maxWidth: 600 }]}>
                    {['Open-Minded', 'Faith', 'Peace', 'Stability', 'Intentionality', 'Creativity', 'Self-Care', 'Longevity', 'Aesthetics'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
                        onPress={() => toggleOption(option)}
                        activeOpacity={0.7}
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
               {[
                 { value: 'Gentle Guide', label: 'Gentle Guide: Kind and encouraging.' },
                 { value: 'Supportive Friend', label: 'Supportive Friend: Direct but caring.' },
                 { value: 'Disciplined Mentor', label: 'Disciplined Mentor: No excuses.' }
               ].map((option) => (
                 <TouchableOpacity
                   key={option.value}
                   style={selectedOptions.includes(option.value) ? styles.selectedOptionButton : styles.optionButton}
                   onPress={() => handlePersonalitySelect(option.value)}
                   activeOpacity={0.7}
                 >
                   <Text style={styles.optionText}>{option.value}</Text>
                 </TouchableOpacity>
               ))}
             </View>
             <Text style={styles.description}>
               Select an option to see the description.
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
            <TouchableOpacity style={styles.glowingButton} onPress={handleNext}>
              <Text style={styles.buttonText}>Finish</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return <Text style={styles.title}>Unknown step</Text>;
    }
  };

  return (      
    <View style={{ flex: 1 }}>
      {renderStep()}
    </View>
  );
}