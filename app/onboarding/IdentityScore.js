import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../styles/onboarding';
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

                for (let i = 1; i <= 7; i++) {
                    const score = answers[`question_${i}_score`];
                    if (score !== undefined) {
                        questionCount++;
                        
                        // For questions 1, 4, 5 - higher score means better alignment
                        // For questions 2, 3, 6, 7 - lower score means better alignment
                        if ([1, 4, 5].includes(i)) {
                            dreamTotal += (3 - score); // Invert so 0 becomes 3, 3 becomes 0
                        } else {
                            dreamTotal += score; // Keep as is
                        }
                        
                        // Doubt score is inverse of dream score
                        doubtTotal += (3 - (dreamTotal / questionCount * 3));
                    }
                }

                // Apply weighted calculation logic to skew toward doubt (intentional for app urgency)
                const baseConfidenceScore = 45 + (dreamTotal / (questionCount * 3)) * 40;
                const baseDoubtScore = 60 - (dreamTotal / (questionCount * 3)) * 45;
                
                const weightedDoubt = baseDoubtScore * 1.6;
                const weightedDream = baseConfidenceScore * 0.4;
                const total = weightedDoubt + weightedDream;
                
                const doubtPercentage = Math.min(Math.max((weightedDoubt / total) * 100, 35), 85);
                const dreamPercentage = Math.max(Math.min(100 - doubtPercentage, 65), 15);
                
                finalDreamScore = Math.round(dreamPercentage);
                finalDoubtScore = Math.round(doubtPercentage);
            } else {
                // Default scores if no answers found - weighted toward doubt for urgency
                const weightedDoubt = 50 * 1.6;
                const weightedDream = 50 * 0.4;
                const total = weightedDoubt + weightedDream;
                
                finalDoubtScore = Math.round((weightedDoubt / total) * 100);
                finalDreamScore = Math.round(100 - finalDoubtScore);
            }
            
            // Set state for display
            setDreamScore(finalDreamScore);
            setDoubtScore(finalDoubtScore);
            
            // Return calculated values for immediate use in animation
            return { dreamScore: finalDreamScore, doubtScore: finalDoubtScore };
            
        } catch (error) {
            console.error('Error calculating scores:', error);
            // Error fallback - weighted toward doubt for urgency
            const weightedDoubt = 50 * 1.6;
            const weightedDream = 50 * 0.4;
            const total = weightedDoubt + weightedDream;
            
            const finalDoubtScore = Math.round((weightedDoubt / total) * 100);
            const finalDreamScore = Math.round(100 - finalDoubtScore);
            
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
                <Text style={styles.analysisHeader}>Analysis complete</Text>

                <View style={styles.barGraph}>
                    {/* Dream Achievement Bar */}
                    <View style={styles.barContainer}>
                        <Text style={styles.barLabel}>Chance of achieving your dreams</Text>
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

                    {/* Doubt Bar */}
                    <View style={styles.barContainer}>
                        <Text style={styles.barLabel}>Chance of being overwhelmed by doubt</Text>
                        <View style={styles.barBackground}>
                            <Animated.View
                                style={[
                                    styles.barFill,
                                    {
                                        width: doubtBarWidthInterpolate,
                                        backgroundColor: '#FF4C4C',
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.barValue}>{doubtScore}%</Text>
                    </View>
                </View>

                <Text style={styles.disclaimer}>
                    This is an analysis based on the quiz and identity you just selected.
                </Text>

                <TouchableOpacity 
                    style={styles.nextButton} 
                    onPress={handleDiscover}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>Discover Why</Text>
                </TouchableOpacity>
            </Animated.View>
        </LinearGradient>
    );
}