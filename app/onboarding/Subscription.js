import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { downgradeUserToFree } from '../../services/auth';
//import { usePlacement, useUser } from 'expo-superwall';

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

  const insets = useSafeAreaInsets();

  // Superwall hooks
  const { registerPlacement, state: placementState } = usePlacement({
    onError: (err) => {
      console.error("Placement Error:", err);
      Alert.alert('Error', 'Failed to load paywall. Please try again.');
    },
    onPresent: (info) => {
      console.log("Paywall Presented:", info);
    },
    onDismiss: (info, result) => {
      console.log("Paywall Dismissed:", info, "Result:", result);
      // Handle the result - if user purchased, navigate to home
      if (result?.outcome === 'purchased') {
        router.push('/tabs/home');
      }
    },
  });

  const { user } = useUser();

  // No-op effect to preserve previous structure without IAP initialization
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Ensure user is set to free locally when viewing this screen in the current flow
        if (mounted) {
          try { await downgradeUserToFree(); } catch {}
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

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
      
      // Trigger Superwall paywall
      await registerPlacement({
        placement: "onboarding_complete"
      });
    } catch (err) {
      console.warn('Failed to show paywall:', err);
      Alert.alert('Error', 'Failed to show paywall. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Trigger Superwall paywall with restore option
      await registerPlacement({
        placement: "onboarding_complete"
      });
    } catch (err) {
      console.warn('Failed to show paywall:', err);
      Alert.alert('Error', 'Failed to show paywall. Please try again.');
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

      {/* Subscription options */}
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
              <Text style={{ color: '#aaa', fontSize: 14, marginTop: 4 }}>$9.99/month after trial ends</Text>
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
              <Text style={{ color: '#aaa', fontSize: 14, marginTop: 4 }}>$29.99/year after trial ends</Text>
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
              <Text style={{ color: '#aaa', fontSize: 14, marginTop: 4 }}>$99.99 for life</Text>
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
      </View>
    </View>
  );
}