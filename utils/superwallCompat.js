import React from 'react';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Check if we're running in Expo Go using multiple detection methods
export const isExpoGo = () => {
  // Method 1: Check appOwnership - this is the most reliable
  if (Constants?.appOwnership === 'expo') {
    return true;
  }

  // Method 2: Check executionEnvironment (for newer Expo versions)
  // 'storeClient' means Expo Go
  if (Constants?.executionEnvironment === 'storeClient') {
    return true;
  }

  // For EAS builds (development or production), we should NOT be in Expo Go
  // Don't use __DEV__ check as it can be true for development builds
  return false;
};

// Mock Superwall hooks for Expo Go compatibility
export const createMockSuperwallHooks = () => {
  // Mock user state
  let mockUser = null;
  let mockAttributes = {};

  const mockUseUser = () => ({
    identify: async (userId, options) => {
      console.log('[Mock Superwall] User identified:', userId, options);
      mockUser = {
        appUserId: userId,
        aliasId: userId,
        applicationInstalledAt: new Date().toISOString(),
        seed: Math.floor(Math.random() * 1000),
        ...mockAttributes,
      };
      return Promise.resolve();
    },
    update: async (attributesOrUpdater) => {
      console.log('[Mock Superwall] Updating user attributes');
      if (typeof attributesOrUpdater === 'function') {
        mockAttributes = attributesOrUpdater(mockAttributes);
      } else {
        mockAttributes = { ...mockAttributes, ...attributesOrUpdater };
      }
      if (mockUser) {
        mockUser = { ...mockUser, ...mockAttributes };
      }
      return Promise.resolve();
    },
    signOut: () => {
      console.log('[Mock Superwall] User signed out');
      mockUser = null;
      mockAttributes = {};
    },
    refresh: async () => {
      console.log('[Mock Superwall] Refreshing user attributes (mock)');
      return Promise.resolve(mockAttributes);
    },
    user: mockUser,
    subscriptionStatus: {
      status: 'NOT_ACTIVE', // Mock as free user in Expo Go (dev mode)
      entitlements: [],
    },
  });

  const mockUsePlacement = (callbacks) => {
    console.log('[Mock Superwall] Placement hook initialized with callbacks:', Object.keys(callbacks || {}));
    return {
      registerPlacement: async ({ placement, params, feature }) => {
        console.log('[Mock Superwall] Dev mode - skipping paywall, proceeding directly to app');
        // In dev mode (Expo Go), skip paywall entirely and proceed directly
        // This simulates free user mode - no paywall shown
        if (feature && typeof feature === 'function') {
          // Call feature immediately (user proceeds as free user)
          feature();
        } else if (callbacks?.onDismiss) {
          // If no feature callback, trigger onDismiss to proceed
          callbacks.onDismiss(null, { purchased: false });
        }
        return Promise.resolve();
      },
      state: { status: 'idle' },
    };
  };

  const mockUseSuperwallEvents = (callbacks) => {
    console.log('[Mock Superwall] Event listeners registered for:', Object.keys(callbacks || {}));
    // Don't actually call the callbacks in Expo Go
    // This hook doesn't return anything (void)
  };

  // Mock Superwall components that properly handle props
  const SuperwallProvider = ({ children, apiKeys, options, ...rest }) => {
    // Accept and ignore props to prevent type errors
    return <>{children}</>;
  };

  const SuperwallLoading = ({ children, ...rest }) => {
    // Don't show loading in Expo Go
    return null;
  };

  const SuperwallLoaded = ({ children, ...rest }) => {
    return <>{children}</>;
  };

  return {
    useUser: mockUseUser,
    usePlacement: mockUsePlacement,
    useSuperwallEvents: mockUseSuperwallEvents,
    SuperwallProvider,
    SuperwallLoading,
    SuperwallLoaded,
  };
};

// Export the appropriate implementation based on environment
export const getSuperwallImplementation = () => {
  // Use mock ONLY in Expo Go to avoid native module issues
  if (isExpoGo()) {
    console.log('Expo Go detected - using mock Superwall implementation');
    console.log('To test real Superwall, build with: npx eas build --profile development');
    console.log('expo-superwall will NOT be loaded in Expo Go to avoid native module errors');
    return createMockSuperwallHooks();
  }

  // Load real Superwall in dev client and production builds
  console.log('Dev client or production build detected - using real Superwall');
  try {
    const realSuperwall = require('expo-superwall');
    console.log('Real Superwall SDK loaded successfully');
    return realSuperwall;
  } catch (error) {
    console.warn('Failed to load expo-superwall, falling back to mock:', error?.message || error);
    console.warn('Error details:', error);
    return createMockSuperwallHooks();
  }
};