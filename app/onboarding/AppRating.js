import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';
import * as StoreReview from 'expo-store-review';
import { usePlacement } from 'expo-superwall';

export default function AppRating() {
    const router = useRouter();
    const fadeValue = useRef(new Animated.Value(0)).current;
    const slideValue = useRef(new Animated.Value(30)).current;
    const starScale = useRef(new Animated.Value(0.8)).current;
    const [isChecking, setIsChecking] = useState(false);
    const [lastPaywallResult, setLastPaywallResult] = useState(null);

    const { registerPlacement } = usePlacement({
        onError: (err) => console.error('Placement Error:', err),
        onPresent: (info) => console.log('Paywall Presented (rating check):', info),
        onDismiss: (info, result) => {
            console.log('Paywall Dismissed (rating check):', info, 'Result:', result);
            setLastPaywallResult(result || null);
        },
    });

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
        
        // Auto-trigger native rating prompt after animation
        setTimeout(() => {
            requestNativeRating();
        }, 1000);
    }, []);

    const requestNativeRating = async () => {
        try {
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
        }
    };

    // Checks subscription status via Superwall. This accounts for App Store
    // promo codes and purchases because Superwall resolves entitlements natively.
    const checkSubscriptionStatus = async () => {
        try {
            setIsChecking(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Configure a placement in Superwall (e.g., "check_subscription_status")
            // to immediately return entitlement state without necessarily presenting a paywall.
            // If your placement does present, the onDismiss handler will capture the result.
            const result = await registerPlacement({ placement: 'check_subscription_status' });
            // Keep last result in state for visibility/debug
            if (result) setLastPaywallResult(result);
            
            // Heuristics to treat user as subscribed
            const purchased = result?.outcome === 'purchased' || result?.entitlementStatus === 'active' || result?.isSubscribed === true;
            return !!purchased;
        } catch (err) {
            console.error('Error checking subscription via Superwall:', err);
            Alert.alert('Subscription', 'Unable to verify subscription at this time.');
            return false;
        } finally {
            setIsChecking(false);
        }
    };

    const handleNext = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Use Superwall entitlement check instead of database/referral logic
        const isSubscribed = await checkSubscriptionStatus();
        if (isSubscribed) {
            router.push('/onboarding/AnimatedProfileCard');
        } else {
            // If not subscribed, route into your paywall flow
            router.push('/onboarding/Subscription');
        }
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const renderStars = () => {
        return (
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
                        size={32} 
                        color="#D4DE95"
                        style={styles.ratingStar}
                    />
                ))}
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
                    Give us a rating
                </Text>

                {renderStars()}

                <Text style={styles.ratingSubtitle}>
                    Keystone was designed specifically for you.
                </Text>
                
                {/* Fake app store reviews for visual display */}
                <ScrollView 
                    style={styles.reviewsContainer}
                    contentContainerStyle={styles.reviewsContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.fakeReview}>
                        <View style={styles.reviewHeader}>
                            <Text style={styles.reviewerName}>Sarah M.</Text>
                            <View style={styles.reviewStars}>
                                {[1,2,3,4,5].map(star => (
                                    <AntDesign key={star} name="star" size={14} color="#D4DE95" />
                                ))}
                            </View>
                        </View>
                        <Text style={styles.reviewText}>
                            "This app actually changed how I think about myself. No more second-guessing everything!"
                        </Text>
                    </View>
                    
                    <View style={styles.fakeReview}>
                        <View style={styles.reviewHeader}>
                            <Text style={styles.reviewerName}>Mike T.</Text>
                            <View style={styles.reviewStars}>
                                {[1,2,3,4,5].map(star => (
                                    <AntDesign key={star} name="star" size={14} color="#D4DE95" />
                                ))}
                            </View>
                        </View>
                        <Text style={styles.reviewText}>
                            "Finally stopped caring what people think. Keystone is exactly what I needed."
                        </Text>
                    </View>
                    
                    <View style={styles.fakeReview}>
                        <View style={styles.reviewHeader}>
                            <Text style={styles.reviewerName}>Alex K.</Text>
                            <View style={styles.reviewStars}>
                                {[1,2,3,4,5].map(star => (
                                    <AntDesign key={star} name="star" size={14} color="#D4DE95" />
                                ))}
                            </View>
                        </View>
                        <Text style={styles.reviewText}>
                            "Life-changing. I'm becoming the person I always wanted to be."
                        </Text>
                    </View>
                </ScrollView>

                <TouchableOpacity 
                    style={styles.nextButton} 
                    onPress={handleNext}
                    activeOpacity={0.8}
                    disabled={isChecking}
                >
                    <Text style={styles.buttonText}>
                        {isChecking ? 'Checking…' : 'Next'}
                    </Text>
                </TouchableOpacity>

                {/* Optional: show last result for debugging */}
                {!!lastPaywallResult && (
                    <Text style={{ color: '#888', fontSize: 12, marginTop: 8 }}>
                        {`Last Result: ${JSON.stringify(lastPaywallResult)}`}
                    </Text>
                )}
            </Animated.View>
        </LinearGradient>
    );
}