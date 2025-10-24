import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { getSuperwallImplementation } from '../utils/superwallCompat';
import { useSuperwallContext } from '../contexts/SuperwallContext';

const { usePlacement, useUser } = getSuperwallImplementation();

export default function HardPaywall({ onSubscribed }) {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const { presentPlacement } = usePlacement();
  const { getSubscriptionStatus } = useUser();
  const { isSubscribed, refreshSubscriptionStatus } = useSuperwallContext();

  const presentHardPaywall = async () => {
    try {
      setIsLoading(true);
      await presentPlacement('subscription_required');
    } catch (error) {
      console.warn('Error presenting paywall:', error);
      Alert.alert('Error', 'Unable to load subscription options. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Refresh subscription status to check for restored purchases
      await refreshSubscriptionStatus();
      
      const status = await getSubscriptionStatus();
      if (status?.isActive) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Your subscription has been restored!');
        if (onSubscribed) {
          onSubscribed();
        }
      } else {
        Alert.alert('No Subscription Found', 'No active subscription found to restore.');
      }
    } catch (error) {
      console.warn('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-present paywall when component mounts
    presentHardPaywall();
  }, []);

  // If user becomes subscribed, call the callback
  useEffect(() => {
    if (isSubscribed && onSubscribed) {
      onSubscribed();
    }
  }, [isSubscribed, onSubscribed]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2B2B2B" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={{ height: insets.top, backgroundColor: '#B9C096' }} />
      <View style={styles.container}>
        {/* Header with restore link */}
        <View style={styles.header}>
          <Text style={styles.title}>Keystone</Text>
          <TouchableOpacity 
            onPress={handleRestorePurchases}
            style={styles.restoreButton}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Text style={styles.restoreText}>Restore</Text>
          </TouchableOpacity>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed" size={48} color="#fff" />
            </View>
          </View>

          <Text style={styles.mainTitle}>Subscription Required</Text>
          <Text style={styles.subtitle}>
            Keystone requires an active subscription to access all features. Start your free trial to continue.
          </Text>

          <TouchableOpacity 
            style={styles.subscribeButton}
            onPress={presentHardPaywall}
            disabled={isLoading}
          >
            <Text style={styles.subscribeButtonText}>
              {isLoading ? 'Loading...' : 'View Subscription Options'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.freeTrialText}>
            3-day free trial - no payment required now
          </Text>
        </View>
      </View>
      <View style={{ height: insets.bottom, backgroundColor: '#B9C096' }} />
    </>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#B9C096',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#B9C096',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#2B2B2B',
    fontWeight: '500',
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
    textAlign: 'center',
  },
  restoreButton: {
    position: 'absolute',
    right: 20,
    top: 10,
    padding: 8,
  },
  restoreText: {
    color: '#2B2B2B',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2B2B2B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2B2B2B',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#5A5A5A',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  subscribeButton: {
    backgroundColor: '#2B2B2B',
    borderRadius: 35,
    paddingVertical: 20,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#2B2B2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  freeTrialText: {
    fontSize: 14,
    color: '#2B2B2B',
    opacity: 0.75,
    textAlign: 'center',
    fontStyle: 'italic',
  },
};