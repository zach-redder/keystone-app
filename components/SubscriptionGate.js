import React from 'react';
import { View, Text } from 'react-native';
import { useSuperwallContext } from '../contexts/SuperwallContext';
import HardPaywall from './HardPaywall';
import { isExpoGo } from '../utils/superwallCompat';

const SubscriptionGate = ({ children, showPaywallIfNotSubscribed = true }) => {
  const { isSubscribed, isLoading } = useSuperwallContext();

  // In Expo Go, show a development notice instead of blocking access
  if (isExpoGo) {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ 
          backgroundColor: '#FFA500', 
          padding: 10, 
          alignItems: 'center' 
        }}>
          <Text style={{ 
            color: '#000', 
            fontWeight: 'bold', 
            fontSize: 12 
          }}>
            🚧 EXPO GO MODE - Superwall disabled for development
          </Text>
        </View>
        {children}
      </View>
    );
  }

  // While loading, don't show anything to prevent flashing
  if (isLoading) {
    return null;
  }

  // If not subscribed and we should show the paywall, show the hard paywall
  if (!isSubscribed && showPaywallIfNotSubscribed) {
    return <HardPaywall />;
  }

  // If subscribed or we don't want to show paywall, render children
  return children;
};

export default SubscriptionGate;