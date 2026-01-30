import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

export default function PaywallTrial() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const fadeValue = useRef(new Animated.Value(0)).current;
    const slideValue = useRef(new Animated.Value(30)).current;
    const imageScale = useRef(new Animated.Value(0.8)).current;
    const pulseValue = useRef(new Animated.Value(1)).current;
    

    // Superwall removed; this screen now just introduces the free trial UX

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeValue, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideValue, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(imageScale, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulsing animation for the motivational icon
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseValue, {
                    toValue: 1.1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseValue, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Entry haptic
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, []);

    const handleStartTrial = async () => {
        try {
            setIsLoading(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            // Continue to Subscription screen which now handles native IAP
            router.replace('/onboarding/Subscription');
        } catch (err) {
            console.warn('Navigation error:', err);
            Alert.alert('Error', 'Failed to continue. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <Animated.View 
                style={[
                    styles.paywallTrialContainer,
                    {
                        opacity: fadeValue,
                        transform: [{ translateY: slideValue }]
                    }
                ]}
            >
                <Text style={styles.paywallTrialTitle}>
                    We want you to try Keystone for free.
                </Text>

                {/* Animated motivational icon */}
                <Animated.View 
                    style={[
                        styles.paywallTrialImageContainer,
                        { 
                            transform: [
                                { scale: imageScale },
                                { scale: pulseValue }
                            ] 
                        }
                    ]}
                >
                    <Image 
                        source={require('../../assets/keystone_transparent.png')} 
                        style={[styles.paywallTrialIcon, { width: 120, height: 120 }]}
                        resizeMode="contain"
                    />
                    <View style={styles.paywallTrialIconGlow} />
                </Animated.View>

                <Text style={styles.paywallTrialSubtitle}>
                    You'll get 3 full days to experience Keystone before committing.
                </Text>

                <TouchableOpacity 
                    style={styles.startTrialButton}
                    onPress={handleStartTrial}
                    activeOpacity={0.8}
                    disabled={isLoading}
                >
                    <Text style={styles.startTrialButtonText}>
                        {isLoading ? 'Loading...' : 'Let\'s Go'}
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </LinearGradient>
    );
}