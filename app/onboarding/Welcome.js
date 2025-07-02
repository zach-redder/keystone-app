import React, { useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';

export default function Welcome() {
  const router = useRouter();
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
  }, []);

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

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/onboarding/Animation'); // Navigate to the first step
  };

  const handleLoginRedirect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/signin');
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Image source={require('../../assets/keystone_transparent.png')} style={styles.logo} />
        <Text style={styles.title}>Keystone</Text>
        <Text style={styles.subtitle}>You just chose to overcome internal tension.</Text>
      </View>
      <Animated.View style={{ transform: [{ scale: pulseValue }] }}>
        <TouchableOpacity
          style={styles.glowingButton}
          onPress={handleGetStarted}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </Animated.View>
      <TouchableOpacity style={styles.secondaryButton} onPress={handleLoginRedirect}>
        <Text style={styles.secondaryButtonText}>I Already Have an Account</Text>
      </TouchableOpacity>
    </View>
  );
}