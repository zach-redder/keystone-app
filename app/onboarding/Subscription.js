import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initConnection,
  getProducts,
  requestSubscription,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  flushFailedPurchasesCachedAsPendingAndroid,
} from 'react-native-iap';

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

export default function SubscriptionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [isPro, setIsPro] = useState(false);
  const purchaseUpdateRef = useRef(null);
  const purchaseErrorRef = useRef(null);

  const insets = useSafeAreaInsets();

  // Initialize IAP connection and load products
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Check for pending subscription from unauthenticated purchase
        const pendingSubscription = await AsyncStorage.getItem('pending_subscription');
        if (pendingSubscription && mounted) {
          setIsPro(true);
        }

        if (Platform.OS === 'android') {
          try { await flushFailedPurchasesCachedAsPendingAndroid(); } catch {}
        }
        const connected = await initConnection();
        if (!connected) {
          console.warn('IAP connection failed');
        }
        const skus = [
          'com.reddermedia.keystone.monthly',
          'com.reddermedia.keystone.yearly',
          'com.reddermedia.keystone.lifetime',
        ];
        const fetched = await getProducts({ skus });
        if (mounted) setProducts(fetched || []);
      } catch (e) {
        console.warn('IAP init error:', e);
      }
    })();

    // Purchase listeners
    purchaseUpdateRef.current = purchaseUpdatedListener(async (purchase) => {
      try {
        const receipt = purchase?.transactionReceipt;
        const productId = purchase?.productId;
        if (receipt) {
          await validateAndUnlock(receipt, productId);
        }
        // Always attempt to finish transaction
        try { await finishTransaction({ purchase, isConsumable: false }); } catch {}
      } catch (err) {
        console.warn('purchaseUpdatedListener error:', err);
      }
    });

    purchaseErrorRef.current = purchaseErrorListener((error) => {
      console.warn('purchaseErrorListener:', error);
      Alert.alert('Purchase Error', 'Something went wrong. Please try again.');
    });

    return () => {
      mounted = false;
      try { purchaseUpdateRef.current?.remove(); } catch {}
      try { purchaseErrorRef.current?.remove(); } catch {}
    };
  }, []);

  const validateAndUnlock = async (receiptBase64, productId) => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // User is authenticated - validate with Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('iap-verify-apple', {
          body: { receiptData: receiptBase64, productId },
          headers: { 'x-user-id': user.id },
        });
        
        if (error) {
          console.warn('Receipt validation error:', error);
          Alert.alert('Validation Error', 'Unable to validate purchase.');
          return;
        }
        
        if (data?.active) {
          setIsPro(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Success', 'Pro unlocked!');
        } else {
          setIsPro(false);
          Alert.alert('Inactive', 'Subscription is not active.');
        }
      } else {
        // User is not authenticated - save to AsyncStorage for later processing
        const subscriptionData = {
          receiptData: receiptBase64,
          productId: productId,
          purchaseDate: new Date().toISOString(),
          validated: false, // Will be validated when user registers
        };
        
        await AsyncStorage.setItem('pending_subscription', JSON.stringify(subscriptionData));
        setIsPro(true); // Temporarily show as pro for unauthenticated users
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Purchase recorded! You\'ll have full access once you create an account.');
      }
    } catch (err) {
      console.warn('validateAndUnlock error:', err);
      Alert.alert('Error', 'Could not validate purchase.');
    }
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
    setTimeout(() => {
      setIsUserScrolling(false);
    }, 5000);
  };


  const handleStartFreeTrial = async () => {
    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const productMap = {
        monthly: 'com.reddermedia.keystone.monthly',
        yearly: 'com.reddermedia.keystone.yearly',
        lifetime: 'com.reddermedia.keystone.lifetime',
      };
      const sku = productMap[selectedSubscription] || productMap.yearly;
      await requestSubscription({ sku });
    } catch (err) {
      console.warn('Purchase start failed:', err);
      Alert.alert('Error', 'Failed to start purchase. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const purchases = await getAvailablePurchases();
      if (!purchases || purchases.length === 0) {
        Alert.alert('No Purchases', 'No purchases found to restore.');
        return;
      }
      // Pick the most recent and validate
      const latest = purchases.sort((a, b) => (b.transactionDate - a.transactionDate))[0];
      const receipt = latest?.transactionReceipt;
      const productId = latest?.productId;
      if (receipt) {
        await validateAndUnlock(receipt, productId);
      } else {
        Alert.alert('Restore Failed', 'No receipt found for restore.');
      }
    } catch (err) {
      console.warn('Restore failed:', err);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsLoading(false);
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
                onPress={() => setSelectedSubscription('monthly')}
              >
                <View style={styles.subscriptionOptionContent}>
                  <Text style={styles.subscriptionTitle}>Monthly</Text>
                  <Text style={styles.subscriptionPrice}>
                    {products.find(p => p.productId === 'com.reddermedia.keystone.monthly')?.localizedPrice || '$9.99/month after trial ends'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Yearly option with badge */}
              <TouchableOpacity 
                style={[
                  styles.subscriptionOption, 
                  styles.recommendedOption,
                  selectedSubscription === 'yearly' && styles.selectedOption
                ]}
                onPress={() => setSelectedSubscription('yearly')}
              >
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>Save 75%</Text>
                </View>
                <View style={styles.subscriptionOptionContent}>
                  <Text style={styles.subscriptionTitle}>Yearly</Text>
                  <Text style={styles.subscriptionPrice}>
                    {products.find(p => p.productId === 'com.reddermedia.keystone.yearly')?.localizedPrice || '$29.99/year after trial ends'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Lifetime option */}
              <TouchableOpacity 
                style={[
                  styles.subscriptionOption,
                  selectedSubscription === 'lifetime' && styles.selectedOption
                ]}
                onPress={() => setSelectedSubscription('lifetime')}
              >
                <View style={styles.subscriptionOptionContent}>
                  <Text style={styles.subscriptionTitle}>Lifetime</Text>
                  <Text style={styles.subscriptionPrice}>
                    {products.find(p => p.productId === 'com.reddermedia.keystone.lifetime')?.localizedPrice || '$99.99 for life'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Start Free Trial button */}
            <TouchableOpacity 
              style={[styles.trialButton, isLoading && styles.disabledButton]} 
              onPress={handleStartFreeTrial}
              disabled={isLoading}
            >
              <Text style={styles.trialButtonText}>
                {selectedSubscription === 'lifetime' ? (isLoading ? 'Processing...' : 'Purchase Lifetime Access') : (isLoading ? 'Processing...' : 'Start Free Trial')}
              </Text>
            </TouchableOpacity>

            {/* Restore Purchases button */}
            <TouchableOpacity 
              style={styles.restoreButton} 
              onPress={handleRestorePurchases}
              disabled={isLoading}
            >
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            </TouchableOpacity>

            {/* No payment text */}
            <Text style={styles.noPaymentText}>No payment due now</Text>

            {isPro && (
              <View style={{ alignItems: 'center', paddingVertical: 8, marginTop: 10 }}>
                <Text style={{ color: '#B9C096', fontSize: 14 }}>You're Pro, enjoy the experience!</Text>
              </View>
            )}
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
  disabledButton: {
    opacity: 0.6,
  },
  restoreButton: {
    backgroundColor: 'transparent',
    borderRadius: 35,
    paddingVertical: 15,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#fff',
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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