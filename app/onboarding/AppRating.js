import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';
import * as StoreReview from 'expo-store-review';

export default function AppRating() {
    const router = useRouter();
    const fadeValue = useRef(new Animated.Value(0)).current;
    const slideValue = useRef(new Animated.Value(30)).current;
    const starScale = useRef(new Animated.Value(0.8)).current;

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
            Animated.spring(starScale, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

        // Entry haptic
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/onboarding/AnimatedProfileCard');
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const handleStarPress = async () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            
            // Check if store review is available
            const isAvailable = await StoreReview.isAvailableAsync();
            
            if (isAvailable) {
                // Request the in-app review
                await StoreReview.requestReview();
            } else {
                // Fallback to opening the app store
                const storeUrl = StoreReview.storeUrl();
                if (storeUrl) {
                    await StoreReview.requestReview();
                }
            }
        } catch (error) {
            console.error('Error requesting app review:', error);
            // Continue with the flow even if rating fails
        }
        
        // Continue to next screen after a brief delay
        setTimeout(() => {
            handleNext();
        }, 1000);
    };

    const renderStars = () => {
        return (
            <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleStarPress}
            >
                <Animated.View 
                    style={[
                        styles.starsContainer,
                        { transform: [{ scale: starScale }] }
                    ]}
                >
                    {[1, 2, 3, 4, 5].map((star) => (
                        <AntDesign 
                            key={star}
                            name="star" 
                            size={24} 
                            color="#D4DE95"
                            style={styles.ratingStar}
                        />
                    ))}
                </Animated.View>
            </TouchableOpacity>
        );
    };

    return (
        <LinearGradient
            colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            {/* Back Arrow */}
            <TouchableOpacity 
                style={styles.backArrow}
                onPress={handleBack}
                activeOpacity={0.7}
            >
                <AntDesign name="arrowleft" size={24} color="#ffffff" />
            </TouchableOpacity>

            <Animated.View 
                style={[
                    styles.ratingContainer,
                    {
                        opacity: fadeValue,
                        transform: [{ translateY: slideValue }]
                    }
                ]}
            >
                <Text style={styles.ratingTitle}>
                    Give Us a Rating
                </Text>

                {renderStars()}

                <Text style={styles.ratingSubtitle}>
                    This app was designed for you.
                </Text>
                
                <Text style={styles.ratingInstructions}>
                    Tap the stars above to rate us in the App Store
                </Text>

                {/* Space for app store reviews - empty for now */}
                <ScrollView 
                    style={styles.reviewsContainer}
                    contentContainerStyle={styles.reviewsContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Reviews will be populated later */}
                    <View style={styles.reviewsPlaceholder}>
                        <Text style={styles.reviewsPlaceholderText}>
                            Real reviews from users like you coming soon...
                        </Text>
                    </View>
                </ScrollView>

                <TouchableOpacity 
                    style={styles.ratingNextButton} 
                    onPress={handleNext}
                    activeOpacity={0.8}
                >
                    <Text style={styles.ratingNextButtonText}>
                        Next
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </LinearGradient>
    );
}