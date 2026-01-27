import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSuperwallImplementation, isExpoGo } from '../../utils/superwallCompat';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { usePlacement } = getSuperwallImplementation();

export default function FreeTrial() {
    const router = useRouter();
    const [hasShownPaywall, setHasShownPaywall] = useState(false);
    const fadeValue = useRef(new Animated.Value(0)).current;
    const slideValue = useRef(new Animated.Value(30)).current;
    const scaleValue = useRef(new Animated.Value(0.9)).current;
    const pulseValue = useRef(new Animated.Value(1)).current;
    
    const { registerPlacement } = usePlacement({
        onDismiss: (paywallInfo, result) => {
            console.log('Paywall dismissed from FreeTrial:', paywallInfo, result);
            // After paywall is dismissed, proceed to registration
            setHasShownPaywall(true);
            router.replace('/register');
        },
    });

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeValue, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideValue, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleValue, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

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

        // Entry haptic
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

    const handleTryForFree = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        // In dev mode (Expo Go), skip paywall and go straight to registration as free user
        if (isExpoGo()) {
            console.log('🔄 Dev mode detected - skipping paywall, proceeding to registration as free user');
            await AsyncStorage.setItem('onboarding_paywall_shown', 'true');
            setHasShownPaywall(true);
            router.replace('/register');
            return;
        }
        
        // In production, show the paywall
        // Mark that we've shown the paywall
        await AsyncStorage.setItem('onboarding_paywall_shown', 'true');
        
        // Trigger Superwall paywall
        try {
            await registerPlacement({
                placement: 'onboarding_complete',
                feature: () => {
                    console.log('User has subscription - proceeding to register');
                    // If user already has subscription, proceed directly
                    setHasShownPaywall(true);
                    router.replace('/register');
                }
            });
            // Note: If paywall is shown and dismissed, onDismiss callback will handle navigation
        } catch (error) {
            console.warn('Error presenting paywall:', error);
            // On error, proceed to registration anyway
            setHasShownPaywall(true);
            router.replace('/register');
        }
    };

    const openExternalLink = async (url) => {
        try {
            await Linking.openURL(url);
        } catch (error) {
            console.warn('Failed to open link:', url, error);
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
                    {
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 40,
                    },
                    {
                        opacity: fadeValue,
                        transform: [{ translateY: slideValue }]
                    }
                ]}
            >
                {/* Main Title */}
                <Text style={[styles.title, { marginTop: 60, marginBottom: 50 }]}>
                    We want you to try Keystone for free
                </Text>

                {/* Trial Details */}
                <View
                    style={{
                        backgroundColor: 'rgba(212, 222, 149, 0.1)',
                        borderRadius: 20,
                        padding: 24,
                        marginTop: 20,
                        marginBottom: 50,
                        borderWidth: 1,
                        borderColor: 'rgba(212, 222, 149, 0.3)',
                        width: '100%',
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            marginBottom: 20,
                            width: '100%',
                        }}
                    >
                        <View style={{ marginRight: 12, marginTop: 2 }}>
                            <MaterialCommunityIcons 
                                name="check-circle" 
                                size={24} 
                                color="#D4DE95" 
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text
                                style={{
                                    color: '#ffffff',
                                    fontSize: 16,
                                    lineHeight: 22,
                                }}
                            >
                                3 days of full access
                            </Text>
                        </View>
                    </View>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            marginBottom: 20,
                            width: '100%',
                        }}
                    >
                        <View style={{ marginRight: 12, marginTop: 2 }}>
                            <MaterialCommunityIcons 
                                name="check-circle" 
                                size={24} 
                                color="#D4DE95" 
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text
                                style={{
                                    color: '#ffffff',
                                    fontSize: 16,
                                    lineHeight: 22,
                                }}
                            >
                                No payment due now
                            </Text>
                        </View>
                    </View>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            width: '100%',
                        }}
                    >
                        <View style={{ marginRight: 12, marginTop: 2 }}>
                            <MaterialCommunityIcons 
                                name="check-circle" 
                                size={24} 
                                color="#D4DE95" 
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text
                                style={{
                                    color: '#ffffff',
                                    fontSize: 16,
                                    lineHeight: 22,
                                }}
                            >
                                Cancel anytime during trial
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Important Note */}
                <Text
                    style={{
                        color: '#b3b3b3',
                        fontSize: 14,
                        textAlign: 'center',
                        marginBottom: 50,
                        lineHeight: 20,
                        paddingHorizontal: 20,
                    }}
                >
                    After your 3-day free trial, your subscription will automatically continue. You can cancel anytime.
                </Text>

                {/* Try for Free Button */}
                <Animated.View style={{ transform: [{ scale: pulseValue }], width: '100%' }}>
                    <TouchableOpacity
                        style={[styles.glowingButton, { width: '100%', paddingHorizontal: 40 }]}
                        onPress={handleTryForFree}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        activeOpacity={0.9}
                    >
                        <Text style={[styles.buttonText, { textAlign: 'center' }]}>
                            Try for Free
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        </LinearGradient>
    );
}

