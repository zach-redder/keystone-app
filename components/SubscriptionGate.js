import React from 'react';
import { View, Text } from 'react-native';
import { useSuperwallContext } from '../contexts/SuperwallContext';
import HardPaywall from './HardPaywall';
import { isExpoGo } from '../utils/superwallCompat';

const SubscriptionGate = ({ children, showPaywallIfNotSubscribed = true }) => {
  const { isSubscribed, isLoading } = useSuperwallContext();

  // In Expo Go, just render children without blocking
  if (isExpoGo()) {
    return children;
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