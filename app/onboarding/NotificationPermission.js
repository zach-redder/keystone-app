import React, { useRef, useEffect } from 'react';
import { Text, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

export default function NotificationPermission() {
    const router = useRouter();

    const fadeValue = useRef(new Animated.Value(0)).current;
    const slideValue = useRef(new Animated.Value(30)).current;
    const iconScale = useRef(new Animated.Value(0.8)).current;
    const iconPulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const requestPermissions = async () => {
            try {
                // Entry haptic
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

                // Start entrance animations
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

                // Pulse animation for the bell icon
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(iconPulse, {
                            toValue: 1.15,
                            duration: 1000,
                            useNativeDriver: true,
                        }),
                        Animated.timing(iconPulse, {
                            toValue: 1,
                            duration: 1000,
                            useNativeDriver: true,
                        }),
                    ])
                ).start();

                // Wait a moment for animations to show, then request permissions
                await new Promise(resolve => setTimeout(resolve, 800));

                // Request notification permissions (triggers native popup)
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;

                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }

                if (finalStatus === 'granted') {
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    console.log('Notification permissions granted');
                } else {
                    console.log('Notification permissions denied by user');
                }

                // Brief pause after permission request completes
                await new Promise(resolve => setTimeout(resolve, 500));

                // Navigate to next screen regardless of permission result
                router.push('/onboarding/AppRating');
            } catch (error) {
                console.error('Error requesting notification permissions:', error);
                // Continue to next screen even if there's an error
                router.push('/onboarding/AppRating');
            }
        };

        requestPermissions();
    }, []);

    return (
        <LinearGradient
            colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <Animated.View
                style={[
                    styles.benefitsContent,
                    {
                        opacity: fadeValue,
                        transform: [{ translateY: slideValue }],
                        flex: 1,
                        justifyContent: 'center',
                        paddingHorizontal: 30,
                    }
                ]}
            >
                {/* Animated Bell Icon */}
                <Animated.View
                    style={[
                        styles.benefitIconContainer,
                        {
                            transform: [
                                { scale: iconScale },
                                { scale: iconPulse }
                            ],
                            marginBottom: 40,
                        }
                    ]}
                >
                    <MaterialCommunityIcons
                        name="bell-ring"
                        size={80}
                        color="#D4DE95"
                        style={styles.benefitIcon}
                    />
                </Animated.View>

                {/* Title */}
                <Text style={[styles.benefitTitle, { marginBottom: 20 }]}>
                    Stay Connected with Your AI
                </Text>

                {/* Description */}
                <Text style={[styles.benefitSubtitle, { marginBottom: 16 }]}>
                    Your custom AI sends personalized reminders throughout the day to keep you aligned with your identity and goals.
                </Text>

                <Text style={[styles.benefitSubtitle, { fontSize: 16, color: 'rgba(255, 255, 255, 0.7)' }]}>
                    Without notifications, the AI can't reach you defeating the purpose of having a personal alignment coach.
                </Text>
            </Animated.View>
        </LinearGradient>
    );
}
