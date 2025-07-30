import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TYPING_PHRASES = [
    'This app is for you.',
    "It's time to take the first step.",
    "Let's do this together."
];

export default function AnimatedProfileCard() {
    const router = useRouter();
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [displayText, setDisplayText] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const [userName, setUserName] = useState('');
    
    const fadeValue = useRef(new Animated.Value(0)).current;
    const slideValue = useRef(new Animated.Value(30)).current;
    const cardScale = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        // Load user name
        const loadUserName = async () => {
            try {
                const name = await AsyncStorage.getItem('@user_name');
                if (name) {
                    setUserName(name);
                }
            } catch (error) {
                console.error('Error loading user name:', error);
            }
        };
        
        loadUserName();

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
            Animated.spring(cardScale, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

        // Entry haptic
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Start typing animation
        startTypingAnimation();
    }, []);

    const startTypingAnimation = () => {
        let phraseIndex = 0;
        let charIndex = 0;
        
        const typeNextChar = () => {
            if (phraseIndex < TYPING_PHRASES.length) {
                const currentPhrase = TYPING_PHRASES[phraseIndex];
                
                if (charIndex < currentPhrase.length) {
                    // Type next character
                    setDisplayText(currentPhrase.substring(0, charIndex + 1));
                    setCurrentPhraseIndex(phraseIndex);
                    charIndex++;
                    
                    // Haptic feedback for each character
                    if (charIndex % 4 === 0) { // Every 4th character (less frequent)
                        Haptics.selectionAsync();
                    }
                    
                    setTimeout(typeNextChar, 45); // Faster typing speed (was 80ms)
                } else {
                    // Finished typing this phrase, pause then move to next
                    setTimeout(() => {
                        phraseIndex++;
                        charIndex = 0;
                        setDisplayText('');
                        
                        if (phraseIndex < TYPING_PHRASES.length) {
                            setTimeout(typeNextChar, 300); // Shorter pause between phrases
                        } else {
                            // All phrases complete - auto-transition
                            setIsTyping(false);
                            setTimeout(() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                router.push('/onboarding/FutureSelfVision');
                            }, 1500); // Shorter final pause
                        }
                    }, 1000); // Shorter hold phrase time
                }
            }
        };
        
        setTimeout(typeNextChar, 1000); // Initial delay
    };

    const getCurrentDate = () => {
        const now = new Date();
        const month = now.toLocaleDateString('en-US', { month: 'long' });
        const year = now.getFullYear();
        return `${month} ${year}`;
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
                    styles.animatedProfileContainer,
                    {
                        opacity: fadeValue,
                        transform: [{ translateY: slideValue }]
                    }
                ]}
            >
                {/* Typing Animation */}
                <View style={styles.typingContainer}>
                    <Text style={styles.typingText}>
                        {displayText}
                        {isTyping && (
                            <Text style={styles.typingCursor}>|</Text>
                        )}
                    </Text>
                </View>

                {/* Profile Card */}
                <Animated.View 
                    style={[
                        styles.animatedProfileCard,
                        { transform: [{ scale: cardScale }] }
                    ]}
                >
                    <View style={styles.profileCardHeader}>
                        <MaterialCommunityIcons 
                            name="rocket-launch" 
                            size={32} 
                            color="#D4DE95"
                            style={styles.profileCardIcon}
                        />
                        <Text style={styles.profileCardHeaderText}>
                            Your Journey Begins
                        </Text>
                    </View>
                    
                    <View style={styles.profileCardContent}>
                        {userName ? (
                            <Text style={styles.profileCardUserName}>
                                {userName}
                            </Text>
                        ) : null}
                        <Text style={styles.profileCardLabel}>
                            Overcoming doubt since
                        </Text>
                        <Text style={styles.profileCardDate}>
                            {getCurrentDate()}
                        </Text>
                        
                        <View style={styles.streakContainer}>
                            <Text style={styles.streakText}>
                                🔥 Streak: 1 day
                            </Text>
                        </View>
                    </View>
                </Animated.View>
            </Animated.View>
        </LinearGradient>
    );
}