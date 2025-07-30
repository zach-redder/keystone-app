import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { styles } from '../../styles/onboarding';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Animation() {
    const router = useRouter();
    const scaleValue = useRef(new Animated.Value(0.5)).current;
    const opacityValue = useRef(new Animated.Value(0)).current;
    const rotateValue = useRef(new Animated.Value(0)).current;
    const pulseValue = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Start entrance animation
        Animated.parallel([
            Animated.timing(scaleValue, {
                toValue: 1,
                duration: 1200,
                easing: Easing.elastic(1.2),
                useNativeDriver: true,
            }),
            Animated.timing(opacityValue, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();

        // Start rotation animation
        Animated.loop(
            Animated.timing(rotateValue, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Start pulsing animation for text
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseValue, {
                    toValue: 1.1,
                    duration: 1500,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseValue, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Discrete haptic feedback at key animation moments
        const hapticTimer1 = setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 1000);
        
        const hapticTimer2 = setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 2500);

        // Auto-transition after 4 seconds
        const timer = setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/onboarding/GoodNews');
        }, 4000);

        return () => {
            clearTimeout(timer);
            clearTimeout(hapticTimer1);
            clearTimeout(hapticTimer2);
        };
    }, []);

    const rotate = rotateValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <LinearGradient
            colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <View style={styles.centerContainer}>
                <Animated.View
                    style={[
                        {
                            transform: [
                                { scale: scaleValue },
                                { rotate: rotate }
                            ],
                            opacity: opacityValue,
                        }
                    ]}
                >
                    <View style={{
                        width: 140,
                        height: 140,
                        borderRadius: 70,
                        backgroundColor: '#D4DE95',
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: '#D4DE95',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.9,
                        shadowRadius: 25,
                        elevation: 15,
                    }}>
                        <MaterialCommunityIcons 
                            name="cog-outline" 
                            size={80} 
                            color="#2b2b2b" 
                        />
                    </View>
                </Animated.View>
                
                <Animated.View style={{ transform: [{ scale: pulseValue }] }}>
                    <Text style={[styles.subtitle, { 
                        marginTop: 40, 
                        fontSize: 24,
                        color: '#ffffff',
                        fontWeight: '600'
                    }]}>
                        Building Your Foundation...
                    </Text>
                </Animated.View>
                
                <Animated.View style={{ opacity: opacityValue, marginTop: 20 }}>
                    <Text style={[styles.subtitle, {
                        fontSize: 16,
                        color: '#b3b3b3',
                        fontStyle: 'italic'
                    }]}>
                        Creating your identity blueprint.
                    </Text>
                </Animated.View>
            </View>
        </LinearGradient>
    );
}
