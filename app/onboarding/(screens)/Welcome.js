import React, { useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

export default function Welcome() {
  const router = useRouter();
  const scaleValue = useRef(new Animated.Value(1)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Button pulse animation
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

    Animated.timing(fadeValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
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
    router.push('/onboarding/Quiz/1');
  };

  const handleLoginRedirect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/signin');
  };

  return (
    <LinearGradient
      colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
      style={styles.gradientContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.titleContainer}>
        <Image source={require('../../../assets/images/logos/keystone_transparent.png')} style={styles.logo} />
        <Text style={styles.title}>Keystone</Text>
        <Animated.Text style={[styles.subtitle, { opacity: fadeValue }]}>
          A place to remember who you are, and become who you want to be.
        </Animated.Text>
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
        <Text style={styles.secondaryButtonText}>I Have an Account</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}