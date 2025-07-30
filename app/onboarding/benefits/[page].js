import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { styles } from '../../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const KEYSTONE_BENEFITS = [
    {
        id: 1,
        icon: 'target',
        iconAnimation: 'glow',
        title: 'Identity Affirmations',
        subtitle: 'Use AI-powered affirmations to realign your daily actions with your highest goals.',
    },
    {
        id: 2,
        icon: 'bell-ring',
        iconAnimation: 'pulse',
        title: 'Daily Reminders',
        subtitle: 'Get powerful nudges at the right moments, based on your identity and goals.',
    },
    {
        id: 3,
        icon: 'chart-line',
        iconAnimation: 'grow',
        title: 'Action Logging',
        subtitle: 'Track progress and patterns in real time to see how you\'re becoming your best self.',
    },
    {
        id: 4,
        icon: 'account-check',
        iconAnimation: 'glow',
        title: 'Stop Caring What People Think',
        subtitle: 'Detach from opinions. Reconnect with yourself and your authentic path forward.',
    },
    {
        id: 5,
        icon: 'rocket-launch',
        iconAnimation: 'bounce',
        title: 'Become Your Best Self',
        subtitle: 'Build a version of you that always follows through on what matters most.',
    }
];

export default function KeystoneBenefits() {
    const router = useRouter();
    const { page } = useLocalSearchParams();
    const currentPage = parseInt(page) || 1;
    const currentItem = KEYSTONE_BENEFITS[currentPage - 1];
    
    const fadeValue = useRef(new Animated.Value(0)).current;
    const slideValue = useRef(new Animated.Value(30)).current;
    const logoScale = useRef(new Animated.Value(0.9)).current;
    const iconScale = useRef(new Animated.Value(0.8)).current;
    const iconAnimation = useRef(new Animated.Value(0)).current;

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
            Animated.spring(logoScale, {
                toValue: 1,
                tension: 120,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.spring(iconScale, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

        // Icon animation loop
        const startIconAnimation = () => {
            if (currentItem.iconAnimation === 'pulse') {
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(iconAnimation, {
                            toValue: 1,
                            duration: 1500,
                            useNativeDriver: true,
                        }),
                        Animated.timing(iconAnimation, {
                            toValue: 0,
                            duration: 1500,
                            useNativeDriver: true,
                        }),
                    ])
                ).start();
            } else if (currentItem.iconAnimation === 'bounce') {
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(iconAnimation, {
                            toValue: 1,
                            duration: 800,
                            useNativeDriver: true,
                        }),
                        Animated.timing(iconAnimation, {
                            toValue: 0,
                            duration: 800,
                            useNativeDriver: true,
                        }),
                        Animated.delay(1000),
                    ])
                ).start();
            } else if (currentItem.iconAnimation === 'grow') {
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(iconAnimation, {
                            toValue: 1,
                            duration: 2000,
                            useNativeDriver: true,
                        }),
                        Animated.timing(iconAnimation, {
                            toValue: 0,
                            duration: 500,
                            useNativeDriver: true,
                        }),
                        Animated.delay(500),
                    ])
                ).start();
            }
        };

        setTimeout(startIconAnimation, 900);

        // Entry haptic
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [page]);

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        if (currentPage < KEYSTONE_BENEFITS.length) {
            router.push(`/onboarding/benefits/${currentPage + 1}`);
        } else {
            // Final screen - navigate to Benefits Deep Dive
            router.push('/onboarding/BenefitsDeepDive');
        }
    };

    // Swipe gesture handlers
    const swipeGesture = Gesture.Pan()
        .onEnd((event) => {
            const { velocityX, translationX } = event;
            
            if (Math.abs(translationX) > 50 || Math.abs(velocityX) > 500) {
                if (translationX > 0 && currentPage > 1) {
                    // Swipe right - go back
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/onboarding/benefits/${currentPage - 1}`);
                } else if (translationX < 0 && currentPage < KEYSTONE_BENEFITS.length) {
                    // Swipe left - go forward
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push(`/onboarding/benefits/${currentPage + 1}`);
                }
            }
        });

    const renderDotIndicators = () => {
        return (
            <View style={styles.dotIndicatorContainer}>
                {KEYSTONE_BENEFITS.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dotIndicator,
                            {
                                backgroundColor: index + 1 === currentPage ? '#D4DE95' : 'rgba(212, 222, 149, 0.3)',
                                width: index + 1 === currentPage ? 12 : 8,
                                height: index + 1 === currentPage ? 12 : 8,
                            }
                        ]}
                    />
                ))}
            </View>
        );
    };

    if (!currentItem) {
        return null;
    }

    return (
        <GestureDetector gesture={swipeGesture}>
            <LinearGradient
                colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
                style={styles.gradientContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
            {/* Keystone Logo */}
            <Animated.View 
                style={[
                    styles.benefitsLogoContainer,
                    { transform: [{ scale: logoScale }] }
                ]}
            >
                <Image 
                    source={require('../../../assets/keystone_transparent.png')} 
                    style={styles.benefitsLogo} 
                />
            </Animated.View>

            <Animated.View 
                style={[
                    styles.benefitsContent,
                    {
                        opacity: fadeValue,
                        transform: [{ translateY: slideValue }]
                    }
                ]}
            >
                {/* Animated Icon */}
                <Animated.View 
                    style={[
                        styles.benefitIconContainer,
                        { 
                            transform: [
                                { scale: iconScale },
                                currentItem.iconAnimation === 'bounce' ? {
                                    translateY: iconAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, -15],
                                    })
                                } : { translateY: 0 },
                                currentItem.iconAnimation === 'grow' ? {
                                    scale: iconAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [1, 1.2],
                                    })
                                } : { scale: 1 }
                            ],
                            opacity: currentItem.iconAnimation === 'pulse' ? 
                                iconAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.8, 1],
                                }) : 1
                        }
                    ]}
                >
                    <MaterialCommunityIcons 
                        name={currentItem.icon} 
                        size={80} 
                        color="#D4DE95"
                        style={styles.benefitIcon}
                    />
                </Animated.View>

                {/* Title */}
                <Text style={styles.benefitTitle}>
                    {currentItem.title}
                </Text>

                {/* Subtitle */}
                <Text style={styles.benefitSubtitle}>
                    {currentItem.subtitle}
                </Text>
            </Animated.View>

            {/* Dot Indicators */}
            {renderDotIndicators()}

            {/* Next Button */}
            <TouchableOpacity 
                style={styles.benefitNextButton} 
                onPress={handleNext}
                activeOpacity={0.8}
            >
                <Text style={styles.benefitNextButtonText}>
                    Next
                </Text>
            </TouchableOpacity>
            </LinearGradient>
        </GestureDetector>
    );
}