import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingProgressHeader from '../OnboardingProgressHeader';

export default function UserInfo() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    
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

    const handleNext = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        // Store user info
        try {
            await AsyncStorage.setItem('@user_name', name.trim());
            await AsyncStorage.setItem('@user_age', age.trim());
        } catch (error) {
            console.error('Error saving user info:', error);
        }
        
        // Navigate to Life Goals
        router.push('/onboarding/FutureSelfVision');
    };

    const isFormValid = name.trim().length > 0 && age.trim().length > 0 && !isNaN(parseInt(age));

    return (
        <LinearGradient
            colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <OnboardingProgressHeader />
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <Animated.View 
                    style={[
                        styles.userInfoContainer,
                        {
                            opacity: fadeValue,
                            transform: [{ translateY: slideValue }]
                        }
                    ]}
                >
                    <Text style={styles.userInfoTitle}>
                        Finally
                    </Text>
                    
                    <Text style={styles.userInfoSubtitle}>
                        Let's personalize your experience
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>What's your name?</Text>
                        <TextInput
                            style={styles.textInput}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            autoCapitalize="words"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>How old are you?</Text>
                        <TextInput
                            style={styles.textInput}
                            value={age}
                            onChangeText={setAge}
                            placeholder="Enter your age"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            keyboardType="numeric"
                            maxLength={3}
                        />
                    </View>

                    <TouchableOpacity 
                        style={[
                            styles.userInfoNextButton,
                            { opacity: isFormValid ? 1 : 0.5 }
                        ]} 
                        onPress={handleNext}
                        disabled={!isFormValid}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.userInfoNextButtonText}>
                            Next
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}