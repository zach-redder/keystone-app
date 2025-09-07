import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { downgradeUserToFree } from '../../services/auth';
import { supabase } from '../../lib/supabase';
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
  const [selectedSubscription, setSelectedSubscription] = useState('yearly'); // Default to yearly
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
      // Get current user ID for the Edge Function
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('iap-verify-apple', {
        body: { receiptData: receiptBase64, productId },
        headers: { 'x-user-id': user?.id || '' },
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
        // Optionally route to home if this screen ends the flow
        // router.push('/tabs/home');
      } else {
        setIsPro(false);
        Alert.alert('Inactive', 'Subscription is not active.');
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

  const handleClose = () => {
    const returnTo = params.returnTo || 'home';
    if (returnTo === 'home') {
      router.push('/tabs/home');
    } else if (returnTo === 'keys') {
      router.push('/tabs/keys');
    } else if (returnTo === 'profile') {
      router.push('/tabs/profile');
    } else {
      router.back();
    }
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
    <View style={{ flex: 1, backgroundColor: '#1f1f1f', paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={handleClose} style={{ position: 'absolute', left: 20 }}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Upgrade</Text>
      </View>

      {/* Features Carousel */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
        ref={scrollViewRef}
        style={{ flexGrow: 0 }}
      >
        {features.map((feature) => (
          <View key={feature.id} style={{ width: screenWidth, alignItems: 'center', paddingHorizontal: 24, paddingTop: 10 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#B9C096',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Ionicons name={feature.icon} size={30} color="#2B2B2B" />
            </View>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 6, textAlign: 'center' }}>{feature.title}</Text>
            <Text style={{ color: '#ccc', fontSize: 16, textAlign: 'center' }}>{feature.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 12 }}>
        {features.map((_, index) => (
          <View
            key={index}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              marginHorizontal: 6,
              backgroundColor: currentIndex === index ? '#B9C096' : '#555',
            }}
          />
        ))}
      </View>

      {/* Subscription options (with localized price if available) */}
      <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
        {/* Monthly */}
        <TouchableOpacity
          style={{
            backgroundColor: selectedSubscription === 'monthly' ? '#2B2B2B' : 'transparent',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: selectedSubscription === 'monthly' ? '#3B3B3B' : '#333',
            paddingVertical: 14,
            paddingHorizontal: 16,
            marginBottom: 12,
          }}
          onPress={() => setSelectedSubscription('monthly')}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Monthly</Text>
              <Text style={{ color: '#aaa', fontSize: 14, marginTop: 4 }}>
                {products.find(p => p.productId === 'com.reddermedia.keystone.monthly')?.localizedPrice || '$9.99/month after trial ends'}
              </Text>
            </View>
            {selectedSubscription === 'monthly' && (
              <Ionicons name="checkmark-circle" size={22} color="#B9C096" />
            )}
          </View>
        </TouchableOpacity>

        {/* Yearly */}
        <TouchableOpacity
          style={{
            backgroundColor: selectedSubscription === 'yearly' ? '#2B2B2B' : 'transparent',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: selectedSubscription === 'yearly' ? '#3B3B3B' : '#333',
            paddingVertical: 14,
            paddingHorizontal: 16,
            marginBottom: 12,
          }}
          onPress={() => setSelectedSubscription('yearly')}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Yearly</Text>
              <Text style={{ color: '#aaa', fontSize: 14, marginTop: 4 }}>
                {products.find(p => p.productId === 'com.reddermedia.keystone.yearly')?.localizedPrice || '$29.99/year after trial ends'}
              </Text>
            </View>
            {selectedSubscription === 'yearly' && (
              <Ionicons name="checkmark-circle" size={22} color="#B9C096" />
            )}
          </View>
        </TouchableOpacity>

        {/* Lifetime */}
        <TouchableOpacity
          style={{
            backgroundColor: selectedSubscription === 'lifetime' ? '#2B2B2B' : 'transparent',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: selectedSubscription === 'lifetime' ? '#3B3B3B' : '#333',
            paddingVertical: 14,
            paddingHorizontal: 16,
            marginBottom: 16,
          }}
          onPress={() => setSelectedSubscription('lifetime')}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Lifetime</Text>
              <Text style={{ color: '#aaa', fontSize: 14, marginTop: 4 }}>
                {products.find(p => p.productId === 'com.reddermedia.keystone.lifetime')?.localizedPrice || '$99.99 for life'}
              </Text>
            </View>
            {selectedSubscription === 'lifetime' && (
              <Ionicons name="checkmark-circle" size={22} color="#B9C096" />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* CTA Buttons */}
      <View style={{ paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 16) }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#B9C096',
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 10,
          }}
          onPress={handleStartFreeTrial}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          <Text style={{ color: '#2B2B2B', fontSize: 18, fontWeight: 'bold' }}>
            {selectedSubscription === 'lifetime' ? (isLoading ? 'Processing...' : 'Purchase Lifetime Access') : (isLoading ? 'Processing...' : 'Start Free Trial')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRestorePurchases} disabled={isLoading} style={{ alignItems: 'center', paddingVertical: 10 }}>
          <Text style={{ color: '#9aa', fontSize: 14 }}>Restore Purchases</Text>
        </TouchableOpacity>

        {isPro && (
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ color: '#B9C096', fontSize: 14 }}>You're Pro, enjoy the experience!</Text>
          </View>
        )}
      </View>
    </View>
  );
}