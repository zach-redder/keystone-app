import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { usePostSignupResume } from '../../../hooks/useOnboardingResume';
import useIdentityKeys from '../../../hooks/useIdentityKeys';
import { KEY_CATEGORIES } from '../../../constants/keyCategories';

const CHIPS_SHOWN_PER_CATEGORY = 4;
const STARTER_CATEGORIES = KEY_CATEGORIES.filter((item) => !item.proOnly);

export default function KeysReady() {
  const router = useRouter();
  usePostSignupResume('/onboarding/KeysReady');
  const { keys } = useIdentityKeys();

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/FreeTrial');
  };

  const handleReferral = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/onboarding/ReferralCode');
  };

  return (
    <LinearGradient
      colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
      style={styles.gradientContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 90, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.goodNewsHeader}>Your keys are ready.</Text>
        <Text style={[styles.goodNewsBody, { marginBottom: 24 }]}>
          These are the anchors Keystone will hold for you.
        </Text>

        {STARTER_CATEGORIES.map(({ label, category }) => {
          const items = keys.filter((key) => key.category === category);
          if (items.length === 0) return null;
          const hiddenCount = items.length - CHIPS_SHOWN_PER_CATEGORY;
          return (
            <View key={category} style={styles.categoryContainer}>
              <Text style={styles.categoryTitle}>{label}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {items.slice(0, CHIPS_SHOWN_PER_CATEGORY).map((key) => (
                  <View key={key.id ?? key.description} style={styles.selectedMultiSelectButton}>
                    <Text style={styles.multiSelectButtonText}>{key.description}</Text>
                  </View>
                ))}
                {hiddenCount > 0 ? (
                  <View style={styles.multiSelectButton}>
                    <Text style={styles.multiSelectButtonText}>+{hiddenCount} more</Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.nextButton} onPress={handleContinue} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={handleReferral} activeOpacity={0.7}>
        <Text style={styles.secondaryButtonText}>Have a referral code?</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}
