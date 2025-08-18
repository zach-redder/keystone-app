import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { styles } from '../../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';

const DOUBT_CONSEQUENCES = [
    {
        id: 1,
        icon: 'account-heart',
        iconAnimation: 'pulse',
        title: 'People-Pleasing',
        subtitle: 'You say yes when you mean no, destroying your authentic self and leading to failure.',
        color: '#FF6B6B'
    },
    {
        id: 2,
        icon: 'clock-alert',
        iconAnimation: 'shake',
        title: 'External Validation',
        subtitle: 'You let others decide your worth, giving away your power to define yourself.',
        color: '#FF6B6B'
    },
    {
        id: 3,
        icon: 'account-cancel',
        iconAnimation: 'fade',
        title: 'Self-Doubt',
        subtitle: "You don't believe in yourself enough to be able to push through hard times.",
        color: '#FF6B6B'
    },
    {
        id: 4,
        icon: 'brain',
        iconAnimation: 'shake',
        title: 'Overthinking',
        subtitle: 'You overthink everything, letting loops of worry replace action keeping you stuck.',
        color: '#FF6B6B'
    },
    {
        id: 5,
        icon: 'lightbulb-on',
        iconAnimation: 'glow',
        title: "It's Time to Change",
        subtitle: 'Overcoming doubt is possible, you just need to realign with who you are.',
        color: '#D4DE95'
    }
];

export default function DoubtConsequences() {
    const router = useRouter();
    const { page } = useLocalSearchParams();
    const currentPage = parseInt(page) || 1;
    const currentItem = DOUBT_CONSEQUENCES[currentPage - 1];
    
    const fadeValue = useRef(new Animated.Value(0)).current;
    const slideValue = useRef(new Animated.Value(30)).current;
    const iconScale = useRef(new Animated.Value(0.8)).current;
    const iconAnimation = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.9)).current;

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
                            duration: 1000,
                            useNativeDriver: true,
                        }),
                        Animated.timing(iconAnimation, {
                            toValue: 0,
                            duration: 1000,
                            useNativeDriver: true,
                        }),
                    ])
                ).start();
            } else if (currentItem.iconAnimation === 'shake') {
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(iconAnimation, {
                            toValue: 1,
                            duration: 100,
                            useNativeDriver: true,
                        }),
                        Animated.timing(iconAnimation, {
                            toValue: -1,
                            duration: 100,
                            useNativeDriver: true,
                        }),
                        Animated.timing(iconAnimation, {
                            toValue: 0,
                            duration: 100,
                            useNativeDriver: true,
                        }),
                        Animated.delay(2000),
                    ])
                ).start();
            }
        };

        setTimeout(startIconAnimation, 800);

        // Entry haptic
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [page]);

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        if (currentPage < DOUBT_CONSEQUENCES.length) {
            router.push(`/onboarding/doubt-consequences/${currentPage + 1}`);
        } else {
            // Move to benefits sequence
            router.push('/onboarding/benefits/1');
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
                    router.push(`/onboarding/doubt-consequences/${currentPage - 1}`);
                } else if (translationX < 0 && currentPage < DOUBT_CONSEQUENCES.length) {
                    // Swipe left - go forward
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push(`/onboarding/doubt-consequences/${currentPage + 1}`);
                } else if (translationX < 0 && currentPage === DOUBT_CONSEQUENCES.length) {
                    // Swipe left on last page - go to benefits
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/onboarding/benefits/1');
                }
            }
        });

    const renderDotIndicators = () => {
        return (
            <View style={styles.dotIndicatorContainer}>
                {DOUBT_CONSEQUENCES.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dotIndicator,
                            {
                                backgroundColor: index + 1 === currentPage ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
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
                colors={currentPage === 5 ? ['#2B2B2B', '#2F2F2C', '#2B2B2B'] : ['#FF6B6B', '#FF4C4C', '#FF6B6B']}
                style={styles.doubtConsequenceContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Keystone Logo
                <Animated.View 
                    style={[
                        styles.benefitsLogoContainer,
                        { transform: [{ scale: logoScale || 1 }] }
                    ]}
                >
                    <Image 
                        source={require('../../../assets/keystone_transparent.png')} 
                        style={styles.benefitsLogo} 
                    />
                </Animated.View> */}

                <Animated.View 
                style={[
                    styles.consequenceContent,
                    {
                        opacity: fadeValue,
                        transform: [{ translateY: slideValue }]
                    }
                ]}
            >
                {/* Animated Icon */}
                <Animated.View 
                    style={[
                        styles.consequenceIconContainer,
                        { 
                            transform: [
                                { scale: iconScale },
                                currentItem.iconAnimation === 'shake' ? {
                                    translateX: iconAnimation.interpolate({
                                        inputRange: [-1, 0, 1],
                                        outputRange: [-10, 0, 10],
                                    })
                                } : { translateX: 0 }
                            ],
                            opacity: currentItem.iconAnimation === 'pulse' ? 
                                iconAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.7, 1],
                                }) : 1
                        }
                    ]}
                >
                    <MaterialCommunityIcons 
                        name={currentItem.icon} 
                        size={80} 
                        color={currentPage === 5 ? '#D4DE95' : '#ffffff'}
                        style={styles.consequenceIcon}
                    />
                </Animated.View>

                {/* Title */}
                <Text style={[
                    styles.consequenceTitle,
                    { color: currentPage === 5 ? '#D4DE95' : '#ffffff' }
                ]}>
                    {currentItem.title}
                </Text>

                {/* Subtitle */}
                <Text style={[
                    styles.consequenceSubtitle,
                    { color: currentPage === 5 ? '#ffffff' : 'rgba(255, 255, 255, 0.9)' }
                ]}>
                    {currentItem.subtitle}
                </Text>
            </Animated.View>

            {/* Dot Indicators */}
            {renderDotIndicators()}

            {/* Next Button */}
            <TouchableOpacity 
                style={[
                    styles.consequenceNextButton,
                    { backgroundColor: currentPage === 5 ? '#D4DE95' : 'rgba(255, 255, 255, 0.2)' }
                ]} 
                onPress={handleNext}
                activeOpacity={0.8}
            >
                <Text style={[
                    styles.consequenceNextButtonText,
                    { color: currentPage === 5 ? '#2B2B2B' : '#ffffff' }
                ]}>
                    Next
                </Text>
            </TouchableOpacity>
            </LinearGradient>
        </GestureDetector>
    );
}