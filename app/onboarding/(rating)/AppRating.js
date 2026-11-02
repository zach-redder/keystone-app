import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { usePostSignupResume } from '../../../hooks/useOnboardingResume';
import { styles } from '../../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';
import { maybeRequestReview } from '../../../services/features/reviewPromptService';

export default function AppRating() {
    const router = useRouter();
    usePostSignupResume('/onboarding/AppRating');
    const [asked, setAsked] = useState(false);
    const fadeValue = useRef(new Animated.Value(0)).current;
    const slideValue = useRef(new Animated.Value(30)).current;
    const starScale = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeValue, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideValue, { toValue: 0, duration: 600, useNativeDriver: true }),
            Animated.spring(starScale, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
        ]).start();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const goNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/onboarding/KeysReady');
    };

    // Goes through the shared review policy so this request counts toward the yearly limit
    const handleRate = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setAsked(true);
        await maybeRequestReview();
    };

    return (
        <LinearGradient
            colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <Animated.View
                style={[styles.ratingContainer, { opacity: fadeValue, transform: [{ translateY: slideValue }] }]}
            >
                <Text style={styles.ratingTitle}>A rating goes a long way</Text>

                <Animated.View style={[styles.starsContainer, { transform: [{ scale: starScale }] }]}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <AntDesign key={star} name="star" size={32} color="#D4DE95" style={styles.ratingStar} />
                    ))}
                </Animated.View>

                <Text style={styles.ratingSubtitle}>
                    If what you have seen so far feels right, a quick rating helps more people who struggle with
                    self-doubt find Keystone.
                </Text>

                <View style={{ flex: 1 }} />

                <TouchableOpacity
                    style={styles.nextButton}
                    onPress={asked ? goNext : handleRate}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>{asked ? 'Continue' : 'Rate Keystone'}</Text>
                </TouchableOpacity>

                {!asked ? (
                    <TouchableOpacity style={styles.secondaryButton} onPress={goNext} activeOpacity={0.7}>
                        <Text style={styles.secondaryButtonText}>Maybe later</Text>
                    </TouchableOpacity>
                ) : null}
            </Animated.View>
        </LinearGradient>
    );
}
