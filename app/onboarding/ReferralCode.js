import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';
import { redeemReferralCode, validateReferralCode } from '../../services/referralService';

export default function ReferralCode() {
    const router = useRouter();
    const [referralCode, setReferralCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [validationMessage, setValidationMessage] = useState('');
    const [isValid, setIsValid] = useState(false);
    
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

    const validateCode = async (code) => {
        if (!code || code.length < 3) {
            setValidationMessage('');
            setIsValid(false);
            return;
        }

        setIsValidating(true);
        try {
            const validation = await validateReferralCode(code);
            if (validation.valid && validation.referralCode) {
                setIsValid(true);
                const subscriptionType = validation.referralCode.subscription_type;
                const typeLabel = subscriptionType === 'monthly' ? '1 Month' : 
                               subscriptionType === 'yearly' ? '1 Year' : 'Lifetime';
                setValidationMessage(`✅ Valid code! Get ${typeLabel} of Pro access`);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } else {
                setIsValid(false);
                setValidationMessage(validation.error || 'Invalid code');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }
        } catch (error) {
            setIsValid(false);
            setValidationMessage('Error validating code');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } finally {
            setIsValidating(false);
        }
    };

    const handleCodeChange = (text) => {
        setReferralCode(text);
        // Debounce validation
        clearTimeout(window.validateTimeout);
        window.validateTimeout = setTimeout(() => validateCode(text), 500);
    };

    const handleSubmit = async () => {
        if (!referralCode || !isValid) return;
        
        setIsRedeeming(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        try {
            const result = await redeemReferralCode(referralCode);
            
            if (result.success) {
                // Show success alert
                Alert.alert(
                    '🎉 Success!',
                    result.message,
                    [
                        {
                            text: 'Continue',
                            onPress: () => router.push('/onboarding/AppRating'),
                        }
                    ]
                );
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Alert.alert(
                    'Error',
                    result.message,
                    [{ text: 'OK' }]
                );
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }
        } catch (error) {
            Alert.alert(
                'Error',
                'An error occurred while processing your referral code. Please try again.',
                [{ text: 'OK' }]
            );
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } finally {
            setIsRedeeming(false);
        }
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
                            style={[
                                styles.referralInput,
                                isValid && { borderColor: '#4CAF50', borderWidth: 2 },
                                validationMessage && !isValid && { borderColor: '#F44336', borderWidth: 2 }
                            ]}
                            value={referralCode}
                            onChangeText={handleCodeChange}
                            placeholder="Enter referral code"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            autoCapitalize="characters"
                            autoCorrect={false}
                            editable={!isRedeeming}
                        />
                        {isValidating && (
                            <View style={styles.validatingIndicator}>
                                <ActivityIndicator size="small" color="#ffffff" />
                            </View>
                        )}
                    </View>

                    {validationMessage ? (
                        <Text style={[
                            styles.validationMessage,
                            isValid ? styles.validMessage : styles.invalidMessage
                        ]}>
                            {validationMessage}
                        </Text>
                    ) : null}

                    {referralCode.length > 0 && (
                        <TouchableOpacity 
                            style={[
                                styles.referralSubmitButton,
                                (!isValid || isRedeeming) && styles.referralSubmitButtonDisabled
                            ]} 
                            onPress={handleSubmit}
                            activeOpacity={0.8}
                            disabled={!isValid || isRedeeming}
                        >
                            {isRedeeming ? (
                                <ActivityIndicator size="small" color="#2B2B2B" />
                            ) : (
                                <Text style={styles.referralSubmitButtonText}>
                                    {isValid ? 'Redeem Code' : 'Apply Code'}
                                </Text>
                            )}
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