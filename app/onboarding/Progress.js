import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

export default function Progress() {
    const router = useRouter();
    const progressValue = useRef(new Animated.Value(0)).current;
    const scaleValue = useRef(new Animated.Value(1)).current;
    const fadeValue = useRef(new Animated.Value(0)).current;
    const textFadeValue = useRef(new Animated.Value(1)).current;
    const hapticMilestones = useRef(new Set()).current; // Moved to top level to fix invalid hook call
    const [displayProgress, setDisplayProgress] = useState(0);
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    
    const analysisTexts = [
        "Syncing your potential...",
        "Building the version of you who follows through...", 
        "Constructing your identity framework...",
        "Calculating your breakthrough score..."
    ];

    useEffect(() => {
        // Entrance animation
        Animated.timing(fadeValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        // Start progress animation after a brief delay
        setTimeout(() => {
            startProgressAnimation();
        }, 800);
    }, []);

    const startProgressAnimation = () => {
        // Animate progress from 0 to 100
        Animated.timing(progressValue, {
            toValue: 100,
            duration: 3000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start(() => {
            // Animation complete, transition to next screen
            setTimeout(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                router.push('/onboarding/IdentityScore');
            }, 800);
        });

        // Update display progress and add precise haptic feedback
        const progressListener = progressValue.addListener(({ value }) => {
            const roundedValue = Math.round(value);
            
            // Precise haptic feedback at exact milestones (prevent duplicates)
            if (roundedValue !== displayProgress) {
                // Haptic at 0% (start)
                if (roundedValue === 0 && !hapticMilestones.has(0)) {
                    hapticMilestones.add(0);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                // Enhanced haptic at quarter milestones with escalating intensity
                else if ((roundedValue === 25 || roundedValue === 50 || roundedValue === 75 || roundedValue === 100) && 
                    !hapticMilestones.has(roundedValue)) {
                    hapticMilestones.add(roundedValue);
                    
                    // Escalating haptic intensity
                    let intensity;
                    if (roundedValue === 25) {
                        intensity = Haptics.ImpactFeedbackStyle.Light;
                    } else if (roundedValue === 50) {
                        intensity = Haptics.ImpactFeedbackStyle.Medium;
                        // Double tap for 50%
                        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 100);
                    } else if (roundedValue === 75) {
                        intensity = Haptics.ImpactFeedbackStyle.Medium;
                        // Triple tap for 75%
                        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 100);
                        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 200);
                    } else if (roundedValue === 100) {
                        intensity = Haptics.ImpactFeedbackStyle.Heavy;
                        // Celebration sequence for 100%
                        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 150);
                        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 300);
                    }
                    
                    Haptics.impactAsync(intensity);
                    
                    // Scale animation for milestone feedback
                    Animated.sequence([
                        Animated.timing(scaleValue, {
                            toValue: roundedValue === 100 ? 1.15 : 1.08,
                            duration: 150,
                            useNativeDriver: true,
                        }),
                        Animated.timing(scaleValue, {
                            toValue: 1,
                            duration: 150,
                            useNativeDriver: true,
                        }),
                    ]).start();
                }
                
                // Update analysis text every 25%
                if (roundedValue % 25 === 0 && roundedValue > 0) {
                    const textIndex = Math.floor(roundedValue / 25) - 1;
                    if (textIndex >= 0 && textIndex < analysisTexts.length && textIndex !== currentTextIndex) {
                        updateAnalysisText(textIndex);
                    }
                }
            }
            setDisplayProgress(roundedValue);
        });

        return () => {
            progressValue.removeListener(progressListener);
        };
    };
    
    const updateAnalysisText = (newIndex) => {
        Animated.sequence([
            Animated.timing(textFadeValue, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setCurrentTextIndex(newIndex);
            Animated.timing(textFadeValue, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
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
                    styles.progressContainer,
                    { opacity: fadeValue }
                ]}
            >
                <View style={{ position: 'relative', alignItems: 'center' }}>
                    {/* Reliable Progress Circle - Alternative Implementation */}
                    <View style={{ width: 280, height: 280, position: 'relative' }}>
                        {/* Background Circle Track */}
                        <View style={{
                            position: 'absolute',
                            width: 280,
                            height: 280,
                            borderRadius: 140,
                            borderWidth: 18,
                            borderColor: '#3c3c3c',
                        }} />
                        
                        {/* SVG Progress Circle with Smooth Fill */}
                        <View style={{ position: 'relative', width: 280, height: 280 }}>
                            <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
                                <Svg width="280" height="280" viewBox="0 0 280 280">
                                    {/* Background Circle */}
                                    <Circle
                                        cx="140"
                                        cy="140"
                                        r="131"
                                        stroke="#3c3c3c"
                                        strokeWidth="18"
                                        fill="transparent"
                                        strokeLinecap="round"
                                    />
                                    
                                    {/* Progress Circle */}
                                    <Circle
                                        cx="140"
                                        cy="140"
                                        r="131"
                                        stroke="#D4DE95"
                                        strokeWidth="18"
                                        fill="transparent"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 131}`}
                                        strokeDashoffset={progressValue.interpolate({
                                            inputRange: [0, 100],
                                            outputRange: [2 * Math.PI * 131, 0],
                                            easing: Easing.out(Easing.quad),
                                        })}
                                        transform="rotate(-90 140 140)"
                                        style={{
                                            shadowColor: '#D4DE95',
                                            shadowOffset: { width: 0, height: 0 },
                                            shadowOpacity: progressValue.interpolate({
                                                inputRange: [0, 100],
                                                outputRange: [0.2, 0.8],
                                            }),
                                            shadowRadius: progressValue.interpolate({
                                                inputRange: [0, 100],
                                                outputRange: [8, 20],
                                            }),
                                            elevation: 15,
                                        }}
                                    />
                                </Svg>
                            </Animated.View>
                        </View>
                        
                        {/* Center Content */}
                        <View style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                            <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
                                <Text style={[styles.progressText, { 
                                    fontSize: 42, 
                                    fontWeight: 'bold',
                                    color: '#ffffff',
                                    textShadowColor: 'rgba(0, 0, 0, 0.5)',
                                    textShadowOffset: { width: 0, height: 2 },
                                    textShadowRadius: 4,
                                }]}>
                                    {displayProgress}%
                                </Text>
                            </Animated.View>
                        </View>
                    </View>
                </View>

                <Animated.View style={{ opacity: textFadeValue }}>
                    <Text style={styles.progressLabel}>
                        {analysisTexts[currentTextIndex]}
                    </Text>
                </Animated.View>
            </Animated.View>
        </LinearGradient>
    );
}