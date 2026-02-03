import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
        "Constructing your identity framework...",
        "Calculating your score..."
    ];

    useEffect(() => {
        // Entrance animation
        Animated.timing(fadeValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        // Start progress animation immediately with haptics
        startProgressAnimation();
    }, []);

    const startProgressAnimation = () => {
        // Initial haptic feedback to start the experience
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
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

        // Update display progress and add escalating haptic feedback
        const progressListener = progressValue.addListener(({ value }) => {
            const roundedValue = Math.round(value);
            
            // Enhanced progressive haptic feedback pattern - starts slow, builds intensity
            if (roundedValue !== displayProgress) {
                // Progressive haptic system based on progress ranges
                const createHapticPattern = (progress) => {
                    if (progress <= 0) return;
                    
                    // Stage 1: 1-20% - Very subtle, sparse feedback
                    if (progress >= 1 && progress <= 20) {
                        if (progress % 15 === 0 && !hapticMilestones.has(`stage1_${progress}`)) {
                            hapticMilestones.add(`stage1_${progress}`);
                            Haptics.selectionAsync(); // Very subtle
                        }
                    }
                    
                    // Stage 2: 21-40% - Light taps, every 10%
                    else if (progress >= 21 && progress <= 40) {
                        if (progress % 10 === 0 && !hapticMilestones.has(`stage2_${progress}`)) {
                            hapticMilestones.add(`stage2_${progress}`);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                    }
                    
                    // Stage 3: 41-60% - Medium intensity, every 8%
                    else if (progress >= 41 && progress <= 60) {
                        if (progress % 8 === 0 && !hapticMilestones.has(`stage3_${progress}`)) {
                            hapticMilestones.add(`stage3_${progress}`);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            // Add subtle follow-up
                            setTimeout(() => Haptics.selectionAsync(), 80);
                        }
                    }
                    
                    // Stage 4: 61-80% - Increasing tempo, every 5%
                    else if (progress >= 61 && progress <= 80) {
                        if (progress % 5 === 0 && !hapticMilestones.has(`stage4_${progress}`)) {
                            hapticMilestones.add(`stage4_${progress}`);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            // Double tap pattern
                            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 100);
                        }
                    }
                    
                    // Stage 5: 81-95% - High intensity, rapid fire
                    else if (progress >= 81 && progress <= 95) {
                        if (progress % 3 === 0 && !hapticMilestones.has(`stage5_${progress}`)) {
                            hapticMilestones.add(`stage5_${progress}`);
                            // Triple tap escalating pattern
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 60);
                            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 120);
                        }
                    }
                    
                    // Stage 6: 96-99% - Intense buildup
                    else if (progress >= 96 && progress <= 99) {
                        if (!hapticMilestones.has(`buildup_${progress}`)) {
                            hapticMilestones.add(`buildup_${progress}`);
                            // Rapid escalating pattern
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 40);
                            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 80);
                            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 120);
                        }
                    }
                };
                
                createHapticPattern(roundedValue);
                
                // Epic finale at 100%
                if (roundedValue === 100 && !hapticMilestones.has('epic_finale')) {
                    hapticMilestones.add('epic_finale');
                    
                    // Multi-layered celebration sequence
                    const celebrationSequence = () => {
                        // Initial burst
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        
                        // Escalating wave pattern
                        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 100);
                        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 150);
                        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 200);
                        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 250);
                        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 300);
                        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 350);
                        
                        // Final triumphant tap
                        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 500);
                    };
                    
                    celebrationSequence();
                    
                    // Celebration scale animation
                    Animated.sequence([
                        Animated.timing(scaleValue, {
                            toValue: 1.15,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(scaleValue, {
                            toValue: 1,
                            duration: 200,
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
                        
                        {/* SVG Progress Circle with Smooth Fill and Glow */}
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
                                    
                                    {/* Glow Effect for Progress Circle */}
                                    <AnimatedCircle
                                        cx="140"
                                        cy="140"
                                        r="131"
                                        stroke="#D4DE95"
                                        strokeWidth="22"
                                        fill="transparent"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 131}`}
                                        strokeDashoffset={progressValue.interpolate({
                                            inputRange: [0, 100],
                                            outputRange: [2 * Math.PI * 131, 0],
                                            extrapolate: 'clamp',
                                        })}
                                        transform="rotate(-90 140 140)"
                                        opacity="0.3"
                                    />
                                    
                                    {/* Main Progress Circle */}
                                    <AnimatedCircle
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
                                            extrapolate: 'clamp',
                                        })}
                                        transform="rotate(-90 140 140)"
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
                    <Text style={[styles.progressLabel, {
                        color: '#ffffff',
                        fontWeight: '600',
                        fontSize: 16,
                    }]}>
                        {analysisTexts[currentTextIndex]}
                    </Text>
                </Animated.View>
            </Animated.View>
        </LinearGradient>
    );
}