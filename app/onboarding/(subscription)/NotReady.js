import React from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signOutUser } from '../../../services/auth/auth';
import { COMMUNITY_URL } from '../../../constants/accessConfig';

export default function NotReady() {
  const router = useRouter();

  const handleSeePlans = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/onboarding/FreeTrial');
  };

  const handleCommunity = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Linking.openURL(COMMUNITY_URL);
    } catch (error) {
      console.error('Error opening community link:', error);
      Alert.alert('Could not open the link', 'Please try again in a moment.');
    }
  };

  const handleReferral = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/onboarding/ReferralCode');
  };

  const handleSwitchAccount = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await signOutUser();
    router.replace('/');
  };

  return (
    <LinearGradient
      colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
      style={styles.gradientContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.goodNewsContainer}>
        <MaterialCommunityIcons name="key-outline" size={44} color="#D4DE95" style={{ marginBottom: 16 }} />
        <Text style={styles.goodNewsHeader}>Not ready yet? That is okay.</Text>
        <Text style={[styles.goodNewsBody, { marginBottom: 32 }]}>
          Keystone is a paid app so the AI conversations can keep going. Your keys are saved, and they will be here
          whenever you decide to come back.
        </Text>

        <TouchableOpacity style={styles.nextButton} onPress={handleSeePlans} activeOpacity={0.8}>
          <Text style={styles.buttonText}>See plans</Text>
        </TouchableOpacity>

        {COMMUNITY_URL ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleCommunity} activeOpacity={0.7}>
            <Text style={styles.secondaryButtonText}>Join the free community</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.secondaryButton} onPress={handleReferral} activeOpacity={0.7}>
          <Text style={styles.secondaryButtonText}>Have a referral code?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleSwitchAccount} activeOpacity={0.7}>
          <Text style={styles.secondaryButtonText}>Use a different account</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
