import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
//import { usePlacement } from 'expo-superwall';

export default function PaywallTrial() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const fadeValue = useRef(new Animated.Value(0)).current;
    const slideValue = useRef(new Animated.Value(30)).current;
    const imageScale = useRef(new Animated.Value(0.8)).current;
    const pulseValue = useRef(new Animated.Value(1)).current;

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

    // Superwall placement hook
    // const { registerPlacement } = usePlacement({
    //     onError: (err) => {
    //         console.error("Superwall Placement Error:", err);
    //         Alert.alert('Error', 'Failed to load subscription options. Please try again.');
    //         setIsLoading(false);
    //     },
    //     onPresent: (info) => {
    //         console.log("Superwall Paywall Presented:", info);
    //         setIsLoading(false);
    //     },
    //     onDismiss: (info, result) => {
    //         console.log("Superwall Paywall Dismissed:", info, "Result:", result);
    //         setIsLoading(false);
            
    //         // Handle different dismissal outcomes
    //         if (result?.outcome === 'purchased' || result?.outcome === 'restored') {
    //             router.replace('/register');
    //         } else {
    //             // User skipped - still allow to continue
    //             router.replace('/register');
    //         }
    //     },
    // });

    const handleStartTrial = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setIsLoading(true);

        router.push('/onboarding/SuperwallPaywall');
        // try {
        //     console.log('Triggering Superwall campaign: onboarding_complete');
        //     await registerPlacement({
        //         placement: "onboarding_complete"
        //     });
        // } catch (err) {
        //     console.error('Failed to trigger Superwall:', err);
        //     Alert.alert('Error', 'Failed to show subscription options. Please try again.');
        //     setIsLoading(false);
        // }
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
                        {isLoading ? 'Loading...' : "Let's Go"}
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </LinearGradient>
    );
}