import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { styles } from '../../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import OnboardingProgressHeader from '../components/OnboardingProgressHeader';
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { KEY_OPTIONS } from '../../../constants/onboardingKeyOptions';
import { suggestKeys } from '../../../services/onboarding/keySuggestions';
import { usePreAuthResume } from '../../../hooks/useOnboardingResume';

const STEP_CONFIG = {
  CoreValues: {
    storageKey: 'core_values',
    title: 'Values define you.',
    subtitle: 'What should people notice in you?',
    next: '/onboarding/LifeGoals',
  },
  LifeGoals: {
    storageKey: 'life_goals',
    title: 'You have big goals.',
    subtitle: 'What are they?',
    next: '/onboarding/FutureSelfVision',
  },
  FutureSelfVision: {
    storageKey: 'future_self_vision',
    title: 'Fast forward 10 years.',
    subtitle: 'Who do you wish to be?',
    next: '/onboarding/HearYou',
  },
};

const CHIPS_PER_PIXEL_ROW = 62;

export default function OnboardingStep() {
  const { step } = useLocalSearchParams();
  const router = useRouter();
  const config = STEP_CONFIG[step];
  usePreAuthResume(`/onboarding/${step}`);

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputValue, setCustomInputValue] = useState('');
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [customOptions, setCustomOptions] = useState([]);
  const [wasSuggested, setWasSuggested] = useState(false);
  const [preferences, setPreferences] = useState({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notification_opt_in: true,
    preferred_reminder_time: '12:00:00',
    preferred_ai_persona: 'Gentle Guide',
  });

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

  useEffect(() => {
    if (!config) return;
    const loadStep = async () => {
      try {
        setSelectedOptions([]);
        setCustomOptions([]);
        setWasSuggested(false);

        const savedPrefs = await AsyncStorage.getItem('user_preferences');
        if (savedPrefs) {
          setPreferences(JSON.parse(savedPrefs));
        }

        const savedSelections = await AsyncStorage.getItem(config.storageKey);
        const savedCustomOptions = await AsyncStorage.getItem(`${step.toLowerCase()}_custom_options`);
        if (savedCustomOptions) {
          setCustomOptions(JSON.parse(savedCustomOptions));
        }

        if (savedSelections) {
          setSelectedOptions(JSON.parse(savedSelections));
          return;
        }

        // First visit only, so going back never overwrites what the user chose
        const intent = await AsyncStorage.getItem('onboarding_intent');
        const suggested = suggestKeys(intent ?? undefined, config.storageKey);
        if (suggested.length > 0) {
          setSelectedOptions(suggested);
          setWasSuggested(true);
        }
      } catch (error) {
        console.error('Error loading onboarding step:', error);
      }
    };
    loadStep();
  }, [step]);

  useEffect(() => {
    debouncedSave('user_preferences', preferences);
  }, [preferences, debouncedSave]);

  const handleNext = async () => {
    if (selectedOptions.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await AsyncStorage.setItem(config.storageKey, JSON.stringify(selectedOptions));
      await AsyncStorage.setItem(`${step.toLowerCase()}_custom_options`, JSON.stringify(customOptions));
      router.push(config.next);
    } catch (error) {
      console.error('Error in handleNext:', error);
    }
  };

  const toggleOption = useCallback((option) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWasSuggested(false);
    setSelectedOptions((prevSelected) =>
      prevSelected.includes(option)
        ? prevSelected.filter((item) => item !== option)
        : [...prevSelected, option]
    );
  }, []);

  const handleCustomInputSubmit = () => {
    const newOption = customInputValue.trim();
    if (!newOption) return;
    if (!customOptions.includes(newOption)) {
      setCustomOptions((prev) => [...prev, newOption]);
    }
    setSelectedOptions((prev) => (prev.includes(newOption) ? prev : [...prev, newOption]));
    setWasSuggested(false);
    setCustomInputValue('');
    setShowCustomInput(false);
  };

  const renderChip = (option) => (
    <TouchableOpacity
      key={option}
      style={selectedOptions.includes(option) ? styles.selectedMultiSelectButton : styles.multiSelectButton}
      onPress={() => toggleOption(option)}
      activeOpacity={0.7}
    >
      <Text style={styles.multiSelectButtonText}>{option}</Text>
    </TouchableOpacity>
  );

  const renderCustomSection = () => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>Custom</Text>
      <View style={styles.customOptionsRow}>
        {customOptions.map(renderChip)}
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
          onPress={() => setShowCustomInput(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.addCustomButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!config) {
    return (
      <LinearGradient colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']} style={styles.gradientContainer}>
        <OnboardingProgressHeader />
        <Text style={styles.selfVisionTitle}>Step not found</Text>
      </LinearGradient>
    );
  }

  const categories = KEY_OPTIONS[config.storageKey];

  return (
    <LinearGradient
      colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
      style={styles.gradientContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <OnboardingProgressHeader />
      <Text style={styles.selfVisionTitle}>{config.title}</Text>
      <Text style={styles.selfVisionSubtitle}>{config.subtitle}</Text>
      {wasSuggested ? (
        <Text style={{ color: '#b3b3b3', fontSize: 14, textAlign: 'center', marginBottom: 8 }}>
          We pre-selected a few based on what you told us. Change anything.
        </Text>
      ) : null}
      <GestureScrollView
        style={{ flex: 1, width: '100%' }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderCustomSection()}
        {Object.entries(categories).map(([category, options]) => (
          <View key={category} style={styles.categoryContainer}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <GestureScrollView horizontal style={styles.scrollView} showsHorizontalScrollIndicator={false}>
              <View style={[styles.optionsContainer, { maxWidth: Math.min(900, Math.max(400, options.length * CHIPS_PER_PIXEL_ROW)) }]}>
                {options.map(renderChip)}
              </View>
            </GestureScrollView>
          </View>
        ))}
      </GestureScrollView>
      <TouchableOpacity
        style={[styles.nextButton, selectedOptions.length === 0 && { opacity: 0.4 }]}
        onPress={handleNext}
        activeOpacity={selectedOptions.length === 0 ? 1 : 0.7}
      >
        <Text style={styles.buttonText}>{selectedOptions.length === 0 ? 'Pick at least one' : 'Next'}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}
