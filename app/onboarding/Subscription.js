import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { getSuperwallImplementation } from '../../utils/superwallCompat';

const { usePlacement, useUser, useSuperwallEvents } = getSuperwallImplementation();

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getSubscriptionStatus } = useUser();
  const { presentPlacement } = usePlacement();

  useSuperwallEvents((event) => {
    console.log('Superwall event:', event.type, event.data);
    
    switch (event.type) {
      case 'transaction_complete':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Welcome to Keystone Pro!', [
          { text: 'Continue', onPress: () => router.replace('/') }
        ]);
        break;
      case 'paywall_dismiss':
        // For hard paywall: re-present if user is not subscribed
        checkSubscriptionAndReact();
        break;
      case 'subscription_start':
        console.log('Subscription started successfully');
        break;
    }
  });

  const checkSubscriptionAndReact = async () => {
    try {
      const status = await getSubscriptionStatus();
      if (!status.isActive) {
        // Hard paywall: user must subscribe to continue
        setTimeout(() => {
          presentHardPaywall();
        }, 1000);
      }
    } catch (error) {
      console.warn('Error checking subscription status:', error);
      // If we can't check status, show paywall to be safe
      setTimeout(() => {
        presentHardPaywall();
      }, 1000);
    }
  };

  const presentHardPaywall = async () => {
    try {
      await presentPlacement('subscription_required');
    } catch (error) {
      console.warn('Error presenting paywall:', error);
      Alert.alert('Error', 'Unable to load subscription options. Please try again.');
    }
  };

  const handleRestorePurchases = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Check subscription status to restore
      const status = await getSubscriptionStatus();
      if (status.isActive) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Your subscription has been restored!', [
          { text: 'Continue', onPress: () => router.replace('/') }
        ]);
      } else {
        Alert.alert('No Subscription Found', 'No active subscription found to restore.');
      }
    } catch (error) {
      console.warn('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    }
  };

  useEffect(() => {
    // Present hard paywall on component mount
    presentHardPaywall();
  }, []);

  return (
    <>
      <View style={{ height: insets.top, backgroundColor: '#B9C096' }} />
      <View style={styles.container}>
        {/* Header with restore link */}
        <View style={styles.header}>
          <Text style={styles.title}>Keystone</Text>
          <TouchableOpacity 
            onPress={handleRestorePurchases}
            style={{ position: 'absolute', right: 20, top: 10, padding: 8 }}
            activeOpacity={0.7}
          >
            <Text style={{ color: '#2B2B2B', fontWeight: '700' }}>Restore</Text>
          </TouchableOpacity>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="key" size={48} color="#fff" />
            </View>
          </View>

          <Text style={styles.mainTitle}>Unlock Full Access</Text>
          <Text style={styles.subtitle}>
            Get unlimited access to all features, advanced AI personalities, and exclusive community perks.
          </Text>

          <TouchableOpacity 
            style={styles.subscribeButton}
            onPress={presentHardPaywall}
          >
            <Text style={styles.subscribeButtonText}>View Subscription Options</Text>
          </TouchableOpacity>

          <Text style={styles.freeTrialText}>
            Start your free trial - no payment required now
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