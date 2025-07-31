import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as RNIap from 'react-native-iap';
import * as Haptics from 'expo-haptics';
import { upgradeUserToPro, downgradeUserToFree } from '../../services/auth';

const { width: screenWidth } = Dimensions.get('window');

// Feature data for the carousel
const features = [
  {
    id: 1,
    icon: "infinite",
    title: "No Daily Limits",
    subtitle: "Access to all features without restrictions"
  },
  {
    id: 2,
    icon: "sparkles",
    title: "Advanced AI",
    subtitle: "Unlock powerful AI feedback to align yourself better"
  },
  {
    id: 3,
    icon: "key",
    title: "Unlimited Keys",
    subtitle: "Create as many keys as you wish"
  },
  {
    id: 4,
    icon: "person",
    title: "AI Personalities",
    subtitle: "Customize your AI experience with unique personalities"
  },
  {
    id: 5,
    icon: "people",
    title: "Community Perks",
    subtitle: "Join the community and unlock exclusive benefits"
  }
];

// Define product IDs for each subscription type
const productIds = {
  monthly: 'com.reddermedia.keystone.pro.monthly',
  yearly: 'com.reddermedia.keystone.pro.yearly', 
  lifetime: 'com.reddermedia.keystone.pro.lifetime'
};

export default function SubscriptionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState('yearly'); // Default to yearly

  const insets = useSafeAreaInsets();

  const checkSubscriptionStatus = async () => {
    try {
      const purchases = await RNIap.getAvailablePurchases();
      // Check for any active subscription or lifetime purchase
      const hasActivePro = purchases.some(
        (purchase) => {
          const isSubscriptionActive = (purchase.productId === productIds.monthly || purchase.productId === productIds.yearly) && !purchase.isExpired;
          const hasLifetime = purchase.productId === productIds.lifetime;
          return isSubscriptionActive || hasLifetime;
        }
      );
      if (hasActivePro) {
        await upgradeUserToPro();
      } else {
        await downgradeUserToFree();
      }
    } catch (err) {
      console.warn('Error checking subscription status:', err);
    }
  };

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      checkSubscriptionStatus();
    }, [])
  );

  const handlePurchase = async (purchase) => {
    // You should validate the purchase with your backend for security
    // For demo, we just upgrade immediately
    await upgradeUserToPro();
  };

  // Auto-slide functionality
  useEffect(() => {
    if (isUserScrolling) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % features.length;
        scrollToIndex(nextIndex);
        return nextIndex;
      });
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [isUserScrolling]);

  const scrollToIndex = (index) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * screenWidth,
        animated: true,
      });
    }
  };

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    setCurrentIndex(index);
  };

  const handleScrollBeginDrag = () => {
    setIsUserScrolling(true);
  };

  const handleScrollEndDrag = () => {
    // Reset auto-scroll after 5 seconds of user inactivity
    setTimeout(() => {
      setIsUserScrolling(false);
    }, 5000);
  };

  const handleStartFreeTrial = async () => {
    try {
      let purchase;
      const selectedProductId = productIds[selectedSubscription];
      
      if (selectedSubscription === 'lifetime') {
        // Use requestPurchase for one-time lifetime purchase
        purchase = await RNIap.requestPurchase(selectedProductId);
      } else {
        // Use requestSubscription for monthly/yearly subscriptions
        purchase = await RNIap.requestSubscription(selectedProductId);
      }
      
      await handlePurchase(purchase);
    } catch (err) {
      console.warn('Purchase error:', err);
    }
  };  

  return (
    <>
      <View style={{ height: insets.top, backgroundColor: '#B9C096' }} />
      <View style={styles.container}>
        {/* Header - no close button for hard paywall */}
        <View style={styles.header}>
          <Text style={styles.title}>Keystone</Text>
        </View>

        {/* Feature Carousel */}
        <View style={styles.carouselWrapper}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            scrollEventThrottle={16}
            style={styles.carousel}
            contentContainerStyle={styles.carouselContent}
          >
            {features.map((feature, index) => (
              <View key={feature.id} style={[styles.featureSlide, { width: screenWidth }]}>
                <View style={styles.featureCard}>
                  <View style={styles.featureContent}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                      <View style={styles.iconCircle}>
                        <Ionicons name={feature.icon} size={32} color="#fff" />
                      </View>
                    </View>

                    {/* Feature title */}
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Dots indicator */}
        <View style={styles.dotsContainer}>
          {features.map((feature, index) => (
            <View
              key={feature.id}
              style={[
                styles.dot,
                currentIndex === index && styles.activeDot
              ]}
            />
          ))}
        </View>

        {/* Subscription background that extends to screen edges */}
        <View style={styles.subscriptionBackground}>
          <View style={styles.subscriptionContent}>
            {/* Subscription options */}
            <View style={styles.subscriptionContainer}>
              {/* Monthly option */}
              <TouchableOpacity 
                style={[
                  styles.subscriptionOption,
                  selectedSubscription === 'monthly' && styles.selectedOption
                ]}
                onPress={() => {
                  setSelectedSubscription('monthly');
                  Haptics.selectionAsync();
                }}
              >
                <View style={styles.subscriptionOptionContent}>
                  <Text style={styles.subscriptionTitle}>Monthly</Text>
                  <Text style={styles.subscriptionPrice}>$9.99/month after trial ends</Text>
                </View>
              </TouchableOpacity>

              {/* Yearly option with badge */}
              <TouchableOpacity 
                style={[
                  styles.subscriptionOption, 
                  styles.recommendedOption,
                  selectedSubscription === 'yearly' && styles.selectedOption
                ]}
                onPress={() => {
                  setSelectedSubscription('yearly');
                  Haptics.selectionAsync();
                }}
              >
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>Save 75%</Text>
                </View>
                <View style={styles.subscriptionOptionContent}>
                  <Text style={styles.subscriptionTitle}>Yearly</Text>
                  <Text style={styles.subscriptionPrice}>$29.99/year after trial ends</Text>
                </View>
              </TouchableOpacity>

              {/* Lifetime option */}
              <TouchableOpacity 
                style={[
                  styles.subscriptionOption,
                  selectedSubscription === 'lifetime' && styles.selectedOption
                ]}
                onPress={() => {
                  setSelectedSubscription('lifetime');
                  Haptics.selectionAsync();
                }}
              >
                <View style={styles.subscriptionOptionContent}>
                  <Text style={styles.subscriptionTitle}>Lifetime</Text>
                  <Text style={styles.subscriptionPrice}>$99.99 for life</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Purchase button with dynamic text */}
            <TouchableOpacity style={styles.trialButton} onPress={handleStartFreeTrial}>
              <Text style={styles.trialButtonText}>
                {selectedSubscription === 'lifetime' ? 'Purchase Lifetime Access' : 'Start Free Trial'}
              </Text>
            </TouchableOpacity>

            {/* Payment info text */}
            <Text style={styles.noPaymentText}>
              {selectedSubscription === 'lifetime' ? 'One-time payment' : 'No payment due now'}
            </Text>
          </View>
        </View>
      </View>
      <View style={{ height: insets.bottom, backgroundColor: '#2B2B2B' }} />
    </>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#B9C096',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    left: 20,
    top: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(43, 43, 43, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2B2B2B',
    marginBottom: 20,
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2B2B2B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2B2B2B',
    textAlign: 'center',
    marginBottom: 10,
    minHeight: 30, // Consistent height for titles
  },
  featureSubtitle: {
    fontSize: 16,
    color: '#5A5A5A',
    textAlign: 'center',
    lineHeight: 22,
    minHeight: 44, // Consistent height for subtitles (2 lines)
    paddingHorizontal: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(43, 43, 43, 0.3)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#2B2B2B',
  },
  subscriptionContainer: {
    width: '100%',
    marginBottom: 20,
  },
  subscriptionBackground: {
    backgroundColor: '#2B2B2B',
    borderRadius: 25,
    padding: 20,
    paddingTop: 30,
  },
  subscriptionOption: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#555',
  },
  selectedOption: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveBadge: {
    position: 'absolute',
    top: 22,
    right: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1,
  },
  saveBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2B2B2B',
  },
  subscriptionContent: {
    alignItems: 'center',
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subscriptionPrice: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  trialButton: {
    backgroundColor: '#D4DE95',
    borderRadius: 35,
    paddingVertical: 20,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#d4de95',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 12,
  },
  trialButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2B2B2B',
  },
  noPaymentText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.75,
    textAlign: 'center',
    fontStyle: 'italic',
    width: '100%',
  },
  carousel: {
    flex: 0,
    height: 220,
  },
  carouselWrapper: {
  },
  carouselContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureSlide: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40, // Centered padding
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    padding: 20,
    width: screenWidth - 80, // Fixed width accounting for slide padding
    height: 220, // Fixed height
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    backdropFilter: 'blur(100px)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
};