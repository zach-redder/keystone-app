import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { usePlacement } from 'expo-superwall';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../../styles/onboarding';
import * as Haptics from 'expo-haptics';

export default function SuperwallPaywall() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Superwall placement hook
    const { registerPlacement, state: placementState } = usePlacement({
        onError: (err) => {
            console.error("Superwall Placement Error:", err);
            setError(err.message || 'Failed to load paywall');
            setIsLoading(false);
            
            // Navigate to register after delay if error
            setTimeout(() => {
                Alert.alert(
                    'Paywall Error',
                    'Unable to load subscription options. You can continue with registration.',
                    [
                        {
                            text: 'Continue',
                            onPress: () => router.replace('/register')
                        }
                    ]
                );
            }, 1000);
        },
        onPresent: (info) => {
            console.log("Superwall Paywall Presented:", info);
            setIsLoading(false);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
        onDismiss: (info, result) => {
            console.log("Superwall Paywall Dismissed:", info, "Result:", result);
            
            // Handle different dismissal outcomes
            if (result?.outcome === 'purchased') {
                // User purchased, continue to registration
                console.log('User purchased subscription');
                router.replace('/register');
            } else if (result?.outcome === 'restored') {
                // User restored purchase
                console.log('User restored subscription');
                router.replace('/register');
            } else {
                // User dismissed without purchasing - still continue to registration
                // This follows freemium model where users can use app without subscribing
                console.log('User skipped subscription');
                router.replace('/register');
            }
        },
    });
    
    useEffect(() => {
        // Trigger Superwall paywall immediately when screen loads
        const triggerPaywall = async () => {
            try {
                console.log('Triggering Superwall campaign: onboarding_complete');
                await registerPlacement({
                    placement: "onboarding_complete"
                });
            } catch (err) {
                console.error('Failed to trigger Superwall paywall:', err);
                setError('Failed to show paywall');
                setIsLoading(false);
                
                // If paywall fails to load, give option to continue
                setTimeout(() => {
                    Alert.alert(
                        'Unable to Load Subscription',
                        'Would you like to continue without subscribing?',
                        [
                            {
                                text: 'Try Again',
                                onPress: () => triggerPaywall()
                            },
                            {
                                text: 'Continue',
                                onPress: () => router.replace('/register'),
                                style: 'cancel'
                            }
                        ]
                    );
                }, 1500);
            }
        };
        
        // Small delay to ensure screen is ready
        setTimeout(triggerPaywall, 100);
    }, []);
    
    // Loading screen while Superwall initializes
    return (
        <LinearGradient
            colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
            style={[styles.gradientContainer, { paddingTop: insets.top }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 20
            }}>
                {isLoading && !error && (
                    <>
                        <ActivityIndicator size="large" color="#B9C096" />
                        <Text style={{
                            color: '#fff',
                            fontSize: 18,
                            marginTop: 20,
                            textAlign: 'center'
                        }}>
                            Loading subscription options...
                        </Text>
                    </>
                )}
                
                {error && (
                    <Text style={{
                        color: '#ff6b6b',
                        fontSize: 16,
                        textAlign: 'center'
                    }}>
                        {error}
                    </Text>
                )}
            </View>
        </LinearGradient>
    );
}