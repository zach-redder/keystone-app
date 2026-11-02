import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboardingKeys } from '../../../hooks/useOnboardingKeys';
import { buildReflection } from '../../../services/onboarding/hearYou';
import { usePreAuthResume } from '../../../hooks/useOnboardingResume';

export default function HearYou() {
  const router = useRouter();
  usePreAuthResume('/onboarding/HearYou');
  const { loaded, intent, keys } = useOnboardingKeys();
  const fadeValue = useRef(new Animated.Value(0)).current;
  const slideValue = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (!loaded) return;
    Animated.parallel([
      Animated.timing(fadeValue, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideValue, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [loaded]);

  const { tension, keyLines, hope } = buildReflection(intent, keys);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/Preview');
  };

  return (
    <LinearGradient
      colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
      style={styles.gradientContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View
        style={[styles.goodNewsContainer, { opacity: fadeValue, transform: [{ translateY: slideValue }] }]}
      >
        <MaterialCommunityIcons name="hand-heart-outline" size={44} color="#D4DE95" style={{ marginBottom: 16 }} />
        <Text style={styles.goodNewsHeader}>We hear you.</Text>
        <Text style={[styles.goodNewsBody, { marginBottom: 24 }]}>{tension}</Text>

        {keyLines.length > 0 ? (
          <View style={[styles.minimalistCard, { marginBottom: 24, paddingVertical: 24 }]}>
            {keyLines.map((line) => (
              <Text key={line} style={styles.cardMainText}>{line}</Text>
            ))}
          </View>
        ) : null}

        <Text style={[styles.goodNewsBody, { fontSize: 18, color: '#ffffff', marginBottom: 32 }]}>{hope}</Text>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Show me how it works</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}
