import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function IdentityScore() {
    const router = useRouter();
    const fadeValue = useRef(new Animated.Value(0)).current;
    const slideValue = useRef(new Animated.Value(30)).current;
    const dreamBarWidth = useRef(new Animated.Value(0)).current;
    const doubtBarWidth = useRef(new Animated.Value(0)).current;
    
    const [dreamScore, setDreamScore] = useState(78); // Default fallback
    const [doubtScore, setDoubtScore] = useState(35); // Default fallback

    useEffect(() => {
        const initializeScreen = async () => {
            const calculatedScores = await calculateScores();
            
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
            ]).start(() => {
                // Start bar animations with the calculated scores (not state)
                animateBars(calculatedScores.dreamScore, calculatedScores.doubtScore);
            });
        };
        
        initializeScreen();
    }, []);

    const calculateScores = async () => {
        try {
            const savedAnswers = await AsyncStorage.getItem('quiz_answers');
            let finalDreamScore, finalDoubtScore;
            
            if (savedAnswers) {
                const answers = JSON.parse(savedAnswers);
                
                // Calculate dream achievement score (higher is better)
                let dreamTotal = 0;
                let doubtTotal = 0;
                let questionCount = 0;

                for (let i = 1; i <= 6; i++) {
                    const score = answers[`question_${i}_score`];
                    if (score !== undefined) {
                        questionCount++;
                        
                        // For questions 1, 5 - higher score means better alignment
                        // For questions 2, 3, 4, 6 - lower score means better alignment
                        if ([1, 5].includes(i)) {
                            dreamTotal += (3 - score); // Invert so 0 becomes 3, 3 becomes 0
                        } else {
                            dreamTotal += score; // Keep as is
                        }
                        
                        // Doubt score is inverse of dream score
                        doubtTotal += (3 - (dreamTotal / questionCount * 3));
                    }
                }

                // Calculate scores in a balanced, positive way
                const baseConfidenceScore = 50 + (dreamTotal / (questionCount * 3)) * 35;
                
                // More balanced calculation - show potential and growth opportunity
                const dreamPercentage = Math.min(Math.max(baseConfidenceScore, 40), 85);
                const growthPercentage = Math.min(Math.max(100 - dreamPercentage, 25), 60);
                
                finalDreamScore = Math.round(dreamPercentage);
                finalDoubtScore = Math.round(growthPercentage);
            } else {
                // Default scores if no answers found - balanced and positive
                finalDreamScore = 65; // Show good potential
                finalDoubtScore = 45; // Show growth opportunity
            }
            
            // Set state for display
            setDreamScore(finalDreamScore);
            setDoubtScore(finalDoubtScore);
            
            // Return calculated values for immediate use in animation
            return { dreamScore: finalDreamScore, doubtScore: finalDoubtScore };
            
        } catch (error) {
            console.error('Error calculating scores:', error);
            // Error fallback - balanced and positive
            const finalDreamScore = 65;
            const finalDoubtScore = 45;
            
            setDreamScore(finalDreamScore);
            setDoubtScore(finalDoubtScore);
            
            return { dreamScore: finalDreamScore, doubtScore: finalDoubtScore };
        }
    };

    const animateBars = (actualDreamScore, actualDoubtScore) => {
        console.log('🎯 Animating bars with CALCULATED scores:', { 
            dreamScore: actualDreamScore, 
            doubtScore: actualDoubtScore 
        });
        
        // Reset bars to 0 first to ensure clean animation
        dreamBarWidth.setValue(0);
        doubtBarWidth.setValue(0);
        
        // Animate dream bar to exact calculated percentage
        setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            console.log('🟢 Animating dream bar to:', actualDreamScore, '%');
            Animated.timing(dreamBarWidth, {
                toValue: actualDreamScore, // Use the passed calculated value, not state
                duration: 1500,
                useNativeDriver: false,
            }).start(() => {
                console.log('✅ Dream bar animation complete at:', actualDreamScore, '%');
                console.log('📊 Dream bar final animated value:', dreamBarWidth._value);
            });
        }, 600);

        // Animate doubt bar with slight delay
        setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            console.log('🔴 Animating doubt bar to:', actualDoubtScore, '%');
            Animated.timing(doubtBarWidth, {
                toValue: actualDoubtScore, // Use the passed calculated value, not state
                duration: 1500,
                useNativeDriver: false,
            }).start(() => {
                console.log('✅ Doubt bar animation complete at:', actualDoubtScore, '%');
                console.log('📊 Doubt bar final animated value:', doubtBarWidth._value);
            });
        }, 1000);
    };

    const handleDiscover = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        router.push('/onboarding/doubt-consequences/1');
    };

    const dreamBarWidthInterpolate = dreamBarWidth.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
    });

    const doubtBarWidthInterpolate = doubtBarWidth.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
    });

    return (
        <LinearGradient
            colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <Animated.View 
                style={[
                    styles.scoreContainer,
                    {
                        opacity: fadeValue,
                        transform: [{ translateY: slideValue }]
                    }
                ]}
            >
                <Text style={styles.analysisHeader}>Your Identity Profile</Text>
                
                <Text style={[styles.scoreSubtitle, { marginBottom: 30, fontSize: 18, color: '#D4DE95' }]}>
                    You have incredible potential. Let's unlock it.
                </Text>

                <View style={styles.barGraph}>
                    {/* Potential Achievement Bar */}
                    <View style={styles.barContainer}>
                        <Text style={styles.barLabel}>Your potential to achieve your dreams</Text>
                        <View style={styles.barBackground}>
                            <Animated.View
                                style={[
                                    styles.barFill,
                                    {
                                        width: dreamBarWidthInterpolate,
                                        backgroundColor: '#D4DE95',
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.barValue}>{dreamScore}%</Text>
                    </View>

                    {/* Growth Opportunity Bar - reframed positively */}
                    <View style={styles.barContainer}>
                        <Text style={styles.barLabel}>Growth opportunity with Keystone</Text>
                        <View style={styles.barBackground}>
                            <Animated.View
                                style={[
                                    styles.barFill,
                                    {
                                        width: doubtBarWidthInterpolate,
                                        backgroundColor: '#4A90E2',
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.barValue}>{doubtScore}%</Text>
                    </View>
                </View>
                
                <Text style={[styles.disclaimer, { marginBottom: 30, fontSize: 14, color: '#888', fontStyle: 'italic' }]}>
                    Every day you use Keystone, you're building the future you envision.
                </Text>

                <TouchableOpacity 
                    style={styles.nextButton} 
                    onPress={handleDiscover}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>Start Your Journey</Text>
                </TouchableOpacity>
            </Animated.View>
        </LinearGradient>
    );
}