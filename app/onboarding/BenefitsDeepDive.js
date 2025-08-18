import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const MOTIVATIONAL_QUOTES = [
    {
        id: 1,
        name: 'Steve Jobs',
        quote: 'Don’t let the noise of others’ opinions drown out your own inner voice.',
        image: require('../../assets/steve_jobs.jpeg'), // Using placeholder for now
    },
    {
        id: 2,
        name: 'Kevin Hart',
        quote: 'The minute you start caring about what other people think is the minute you stop being yourself.',
        image: require('../../assets/kevin_hart.jpg'), // Using placeholder for now
    },
    {
        id: 3,
        name: 'David Goggins',
        quote: 'The biggest thing that holds people back is not even fear, it’s what other people think.',
        image: require('../../assets/david_goggins.jpg'), // Using placeholder for now
    },
];

export default function BenefitsDeepDive() {
    const router = useRouter();
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

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/onboarding/ReferralCode');
    };

    const handleScroll = () => {
        // Removed haptic feedback from scrolling for smoother experience
    };

    const renderQuote = (quote, index) => {
        return (
            <Animated.View 
                key={quote.id}
                style={[
                    styles.quoteCard,
                    {
                        opacity: fadeValue,
                        transform: [{
                            translateY: slideValue.interpolate({
                                inputRange: [0, 30],
                                outputRange: [0, 30 + (index * 10)],
                            })
                        }]
                    }
                ]}
            >
                <View style={styles.quoteHeader}>
                    <Image source={quote.image} style={styles.quoteImage} />
                    <Text style={styles.quoteName}>{quote.name}</Text>
                </View>
                <View style={styles.quoteBubble}>
                    <Text style={styles.quoteText}>"{quote.quote}"</Text>
                </View>
            </Animated.View>
        );
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
                    styles.benefitsDeepDiveContainer,
                    { opacity: fadeValue, transform: [{ translateY: slideValue }] }
                ]}
            >
                <Text style={styles.benefitsDeepDiveTitle}>
                    Why Keystone?
                </Text>

                <ScrollView 
                    style={styles.quotesScrollView}
                    contentContainerStyle={styles.quotesScrollContent}
                    showsVerticalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={100}
                >
                    {MOTIVATIONAL_QUOTES.map((quote, index) => renderQuote(quote, index))}
                </ScrollView>

                {/* Sticky Next Button */}
                <View style={styles.stickyButtonContainer}>
                    <TouchableOpacity 
                        style={styles.benefitsDeepDiveNextButton} 
                        onPress={handleNext}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.benefitsDeepDiveNextButtonText}>
                            Next
                        </Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </LinearGradient>
    );
}