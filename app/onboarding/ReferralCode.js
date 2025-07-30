import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';

export default function ReferralCode() {
    const router = useRouter();
    const [referralCode, setReferralCode] = useState('');
    
    const fadeValue = useRef(new Animated.Value(0)).current;
    const slideValue = useRef(new Animated.Value(30)).current;

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
        ]).start();

        // Entry haptic
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/onboarding/AppRating');
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const handleSubmit = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // TODO: Handle referral code logic
        router.push('/onboarding/AppRating');
    };

    return (
        <LinearGradient
            colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            {/* Back Arrow */}
            <TouchableOpacity 
                style={styles.backArrow}
                onPress={handleBack}
                activeOpacity={0.7}
            >
                <AntDesign name="arrowleft" size={24} color="#ffffff" />
            </TouchableOpacity>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <Animated.View 
                    style={[
                        styles.referralContainer,
                        {
                            opacity: fadeValue,
                            transform: [{ translateY: slideValue }]
                        }
                    ]}
                >
                    <Text style={styles.referralTitle}>
                        Do you have a referral code?
                    </Text>

                    <View style={styles.referralInputContainer}>
                        <TextInput
                            style={styles.referralInput}
                            value={referralCode}
                            onChangeText={setReferralCode}
                            placeholder="Enter referral code"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            autoCapitalize="characters"
                            autoCorrect={false}
                        />
                    </View>

                    {referralCode.length > 0 && (
                        <TouchableOpacity 
                            style={styles.referralSubmitButton} 
                            onPress={handleSubmit}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.referralSubmitButtonText}>
                                Apply Code
                            </Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity 
                        style={styles.skipButton}
                        onPress={handleSkip}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.skipButtonText}>
                            Skip This Step
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}