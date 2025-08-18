import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function GoodNews() {
    const router = useRouter();
    const fadeValue = useRef(new Animated.Value(0)).current;
    const slideValue = useRef(new Animated.Value(50)).current;
    const scaleValue = useRef(new Animated.Value(0.8)).current;
    const bounceValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeValue, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideValue, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleValue, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Add haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, []);

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/onboarding/Quiz/1');
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
                    styles.goodNewsContainer,
                    {
                        opacity: fadeValue,
                        transform: [{ translateY: slideValue }]
                    }
                ]}
            >
                <Text style={styles.goodNewsHeader}>Good news!</Text>
                
                <Text style={styles.goodNewsBody}>
                    We've already built your profile:
                </Text>

                                <Animated.View 
                    style={[
                        styles.minimalistCard,
                        { 
                            transform: [
                                { scale: scaleValue },
                                { translateY: bounceValue.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -8],
                                }) }
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

                <Text style={[styles.goodNewsBody, { fontSize: 18, marginBottom: 40 }]}>
                    Now let's build your identity!
                </Text>

                <TouchableOpacity 
                    style={styles.nextButton} 
                    onPress={handleNext}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
            </Animated.View>
        </LinearGradient>
    );
}