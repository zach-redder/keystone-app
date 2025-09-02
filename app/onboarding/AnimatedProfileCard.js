import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TYPING_PHRASES = [
    "Keystone is now custom built just for you.",
    "It's designed to help you become your authentic self.",
    "Now, it's time for you to take the first step."
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
                if (name && name.trim()) {
                    setUserName(name.trim());
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
                    
                    // Haptic feedback for each character - more rapid
                    if (charIndex % 2 === 0) { // Every 2nd character (more frequent)
                        Haptics.selectionAsync();
                    }
                    
                    setTimeout(typeNextChar, 25); // Much faster typing speed
                } else {
                    // Finished typing this phrase, pause then move to next
                    setTimeout(() => {
                        phraseIndex++;
                        charIndex = 0;
                        setDisplayText('');
                        
                        if (phraseIndex < TYPING_PHRASES.length) {
                            setTimeout(typeNextChar, 150); // Much shorter pause between phrases
                        } else {
                            // All phrases complete - auto-transition much faster
                            setIsTyping(false);
                            setTimeout(() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                router.push('/register');
                            }, 800); // Much shorter final pause
                        }
                    }, 1200); // Much shorter hold phrase time
                }
            }
        };
        
        setTimeout(typeNextChar, 500); // Shorter initial delay
    };

    const getCurrentDate = () => {
        const date = new Date();
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
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
                        styles.minimalistCard,
                        { 
                            transform: [
                                { scale: cardScale }
                            ] 
                        }
                    ]}
                >
                    <MaterialCommunityIcons 
                        name="rocket-launch" 
                        size={32} 
                        color="#D4DE95" 
                        style={styles.cardIcon}
                    />
                    
                    <Text style={styles.cardMainText}>
                        Overcoming doubt since
                    </Text>
                    <Text style={styles.cardDateText}>
                        {getCurrentDate()}
                    </Text>
                    
                    <View style={styles.streakBadgeMinimal}>
                        <MaterialCommunityIcons 
                            name="fire" 
                            size={18} 
                            color="#FF6B6B" 
                            style={{ marginRight: 6 }}
                        />
                        <Text style={styles.streakTextMinimal}>1 day streak</Text>
                    </View>
                </Animated.View>
            </Animated.View>
        </LinearGradient>
    );
}