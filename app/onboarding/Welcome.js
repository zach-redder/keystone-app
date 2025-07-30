import React, { useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';

export default function Welcome() {
  const router = useRouter();
  const scaleValue = useRef(new Animated.Value(1)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const starScale = useRef(new Animated.Value(0.8)).current;

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

    // Star entrance animations
    Animated.parallel([
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(starScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
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
    <LinearGradient
              colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
      style={styles.gradientContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.titleContainer}>
        <Image source={require('../../assets/keystone_transparent.png')} style={styles.logo} />
        <Text style={styles.title}>Keystone</Text>
        <Text style={styles.subtitle}>You just chose to overcome doubt and achieve your dreams.</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star, index) => (
            <Animated.View
              key={index}
              style={[
                styles.premiumStar,
                { 
                  opacity: fadeValue,
                  transform: [{ scale: starScale }] 
                }
              ]}
            >
              <AntDesign name="star" size={24} color="#D4DE95" style={styles.starGlow} />
            </Animated.View>
          ))}
        </View>
      </View>
      <Animated.View style={{ transform: [{ scale: pulseValue }] }}>
        <TouchableOpacity
          style={styles.glowingButton}
          onPress={handleGetStarted}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={styles.buttonText}>Get Started!</Text>
        </TouchableOpacity>
      </Animated.View>
      <TouchableOpacity style={styles.secondaryButton} onPress={handleLoginRedirect}>
        <Text style={styles.secondaryButtonText}>I Have an Account</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}