import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const MOTIVATIONAL_QUOTES = [
    {
        id: 1,
        name: 'Jay Shetty',
        quote: 'You are not what you think you are. You are what you think.',
        image: require('../../assets/keystone_transparent.png'), // Using placeholder for now
    },
    {
        id: 2,
        name: 'Mel Robbins',
        quote: 'You are one decision away from a completely different life.',
        image: require('../../assets/keystone_transparent.png'), // Using placeholder for now
    },
    {
        id: 3,
        name: 'Lewis Howes',
        quote: 'Your identity drives your actions, and your actions create your results.',
        image: require('../../assets/keystone_transparent.png'), // Using placeholder for now
    },
    {
        id: 4,
        name: 'David Goggins',
        quote: 'The most important conversation you have every day is the one you have with yourself.',
        image: require('../../assets/keystone_transparent.png'), // Using placeholder for now
    },
    {
        id: 5,
        name: 'Brené Brown',
        quote: 'Owning our story and loving ourselves through that process is the bravest thing we will ever do.',
        image: require('../../assets/keystone_transparent.png'), // Using placeholder for now
    },
    {
        id: 6,
        name: 'Tony Robbins',
        quote: 'The quality of your life is the quality of your relationships with yourself.',
        image: require('../../assets/keystone_transparent.png'), // Using placeholder for now
    }
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