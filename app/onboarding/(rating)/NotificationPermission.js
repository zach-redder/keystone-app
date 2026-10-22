import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

export default function NotificationPermission() {
    const router = useRouter();
    const [hasResponded, setHasResponded] = useState(false);

    const fadeValue = useRef(new Animated.Value(0)).current;
    const slideValue = useRef(new Animated.Value(30)).current;
    const iconScale = useRef(new Animated.Value(0.8)).current;
    const iconPulse = useRef(new Animated.Value(1)).current;
    const notificationBoxFade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entry haptic
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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

        // Show notification box after a delay
        setTimeout(() => {
            Animated.timing(notificationBoxFade, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        }, 800);
    }, []);

    const handleAllow = async () => {
        if (hasResponded) return;
        
        setHasResponded(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus === 'granted') {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            // Navigate to next screen
            setTimeout(() => {
                router.push('/onboarding/AppRating');
            }, 500);
        } catch (error) {
            console.error('Error requesting notification permissions:', error);
            setTimeout(() => {
                router.push('/onboarding/AppRating');
            }, 500);
        }
    };

    const handleDontAllow = () => {
        if (hasResponded) return;
        
        setHasResponded(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Navigate to next screen
        setTimeout(() => {
            router.push('/onboarding/AppRating');
        }, 300);
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
                        paddingHorizontal: 30,
                    },
                    {
                        opacity: fadeValue,
                        transform: [{ translateY: slideValue }]
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
                            marginBottom: 30,
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
                <Text style={[styles.benefitTitle, { marginBottom: 15, textAlign: 'center' }]}>
                    Stay Connected
                </Text>

                {/* Brief Description */}
                <Text style={[styles.benefitSubtitle, { marginBottom: 60, textAlign: 'center', fontSize: 16 }]}>
                    Notifications help your AI keep you aligned with your goals.
                </Text>

                {/* Notification Box */}
                <Animated.View
                    style={{
                        opacity: notificationBoxFade,
                        transform: [
                            {
                                translateY: notificationBoxFade.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [20, 0],
                                })
                            }
                        ],
                        width: '100%',
                    }}
                >
                    <View
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            borderRadius: 28,
                            padding: 24,
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.15)',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 12 },
                            shadowOpacity: 0.25,
                            shadowRadius: 24,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        <View
                            style={{
                                position: 'absolute',
                                top: 8,
                                left: 12,
                                right: 12,
                                height: 2,
                                backgroundColor: 'rgba(255, 255, 255, 0.35)',
                                borderRadius: 2,
                                opacity: 0.6,
                            }}
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                            <MaterialCommunityIcons
                                name="bell-ring"
                                size={28}
                                color="#D4DE95"
                            />
                            <Text style={{ fontSize: 18, fontWeight: '700', color: '#ffffff', marginLeft: 12 }}>
                                Keystone
                            </Text>
                        </View>
                        <Text style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 20, lineHeight: 22 }}>
                            Allow notifications to keep your reflection going?
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                            <TouchableOpacity
                                onPress={handleDontAllow}
                                style={{
                                    flex: 1,
                                    paddingVertical: 14,
                                    borderRadius: 18,
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                    alignItems: 'center',
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={{ fontSize: 16, color: '#ffffff', fontWeight: '600' }}>
                                    Don't Allow
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleAllow}
                                style={{
                                    flex: 1,
                                    paddingVertical: 14,
                                    borderRadius: 18,
                                    backgroundColor: '#D4DE95',
                                    alignItems: 'center',
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={{ fontSize: 16, color: '#2B2B2B', fontWeight: '700' }}>
                                    Allow
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </Animated.View>
        </LinearGradient>
    );
}
