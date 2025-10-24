import Constants from 'expo-constants';

// Check if we're running in Expo Go
export const isExpoGo = Constants?.appOwnership === 'expo';

// Mock Superwall hooks for Expo Go compatibility
export const createMockSuperwallHooks = () => {
  const mockUseUser = () => ({
    identify: async (userId) => {
      console.log('[Mock Superwall] User identified:', userId);
    },
    setUserAttributes: async (attributes) => {
      console.log('[Mock Superwall] User attributes set:', attributes);
    },
    getSubscriptionStatus: async () => {
      console.log('[Mock Superwall] Getting subscription status (mock)');
      return { isActive: true }; // Mock as subscribed for Expo Go testing
    },
  });

  const mockUsePlacement = () => ({
    presentPlacement: async (placementId) => {
      console.log('[Mock Superwall] Would present placement:', placementId);
      // In Expo Go, just log instead of showing actual paywall
      return Promise.resolve();
    },
  });

  const mockUseSuperwallEvents = (callback) => {
    console.log('[Mock Superwall] Event listener registered');
    // Don't actually call the callback in Expo Go
    return () => console.log('[Mock Superwall] Event listener removed');
  };

  const mockSuperwall = {
    SuperwallProvider: ({ children }) => children,
    SuperwallLoading: ({ children }) => null, // Don't show loading in Expo Go
    SuperwallLoaded: ({ children }) => children,
  };

  return {
    useUser: mockUseUser,
    usePlacement: mockUsePlacement,
    useSuperwallEvents: mockUseSuperwallEvents,
    ...mockSuperwall,
  };
};

// Export the appropriate implementation based on environment
export const getSuperwallImplementation = () => {
  if (isExpoGo) {
    console.log('🔄 Running in Expo Go - using mock Superwall implementation');
    return createMockSuperwallHooks();
  } else {
    console.log('🚀 Running in development/production build - using real Superwall');
    try {
      return require('expo-superwall');
    } catch (error) {
      console.warn('Failed to load expo-superwall, falling back to mock:', error);
      return createMockSuperwallHooks();
    }
  }
};