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
  const { subscriptionStatus } = useUser();
  const { registerPlacement } = usePlacement({
    onDismiss: (paywallInfo, result) => {
      console.log('Paywall dismissed:', paywallInfo, result);
      // For hard paywall: re-present if user is not subscribed
      checkSubscriptionAndReact();
    },
  });

  useSuperwallEvents({
    onSubscriptionStatusChange: (status) => {
      console.log('Subscription status changed:', status);
      if (status?.status === 'ACTIVE') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Welcome to Keystone Pro!', [
          { text: 'Continue', onPress: () => router.replace('/register') }
        ]);
      }
    },
    onSuperwallEvent: (eventInfo) => {
      console.log('Superwall event:', eventInfo.event, eventInfo.params);
    },
  });

  const checkSubscriptionAndReact = async () => {
    try {
      const status = subscriptionStatus;
      if (status?.status !== 'ACTIVE') {
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
      await registerPlacement({
        placement: 'onboarding_complete',
        feature: () => {
          console.log('User has subscription - routing to register');
          router.replace('/register');
        }
      });
    } catch (error) {
      console.warn('Error presenting paywall:', error);
      Alert.alert('Error', 'Unable to load subscription options. Please try again.');
    }
  };

  const handleRestorePurchases = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Check subscription status to restore
      const status = subscriptionStatus;
      if (status?.status === 'ACTIVE') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Your subscription has been restored!', [
          { text: 'Continue', onPress: () => router.replace('/register') }
        ]);
      } else {
        Alert.alert('No Subscription Found', 'No active subscription found to restore.');
      }
    } catch (error) {
      console.warn('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    }
  };

  const handleRedeemCode = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Use Superwall's presentCodeRedemption method if available
      const Superwall = await import('@superwall/react-native-superwall');
      if (Superwall.default && Superwall.default.presentCodeRedemption) {
        await Superwall.default.presentCodeRedemption();
      } else {
        // Fallback: show alert with instructions
        Alert.alert(
          'Redeem Offer Code',
          'To redeem an App Store offer code:\n\n1. Go to the App Store app\n2. Tap your profile icon\n3. Tap "Redeem Gift Card or Code"\n4. Enter your code',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.warn('Code redemption error:', error);
      Alert.alert(
        'Redeem Code',
        'Please go to the App Store to redeem your offer code.',
        [{ text: 'OK' }]
      );
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
          <View style={{ position: 'absolute', right: 20, top: 10, flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={handleRedeemCode}
              style={{ padding: 8 }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#2B2B2B', fontWeight: '700' }}>Redeem Code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRestorePurchases}
              style={{ padding: 8 }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#2B2B2B', fontWeight: '700' }}>Restore</Text>
            </TouchableOpacity>
          </View>
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