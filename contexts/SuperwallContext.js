import { getSessionUser } from '../services/auth/currentUser';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSuperwallImplementation } from '../utils/superwallCompat';
import { supabase } from '../lib/supabase';
import { handleSuperwallPurchaseComplete, migrateFromIAPToSuperwall, checkUserProStatus } from '../services/subscription/subscriptionService';

const { useUser, useSuperwallEvents } = getSuperwallImplementation();

const SuperwallContext = createContext({});

export const useSuperwallContext = () => {
  const context = useContext(SuperwallContext);
  if (!context) {
    throw new Error('useSuperwallContext must be used within a SuperwallProvider');
  }
  return context;
};

export const SuperwallContextProvider = ({ children }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [localSubscriptionStatus, setLocalSubscriptionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { identify, update, subscriptionStatus, refresh } = useUser();

  // Handle Superwall events
  useSuperwallEvents({
    onSubscriptionStatusChange: async (status) => {
      console.log('Subscription status changed:', status);
      setLocalSubscriptionStatus(status);
      const isActive = status?.status === 'ACTIVE';
      setIsSubscribed(isActive);

      if (isActive) {
        try {
          await handleSuperwallPurchaseComplete(status);
          if (refresh) await refresh();
        } catch (error) {
          console.error('Error updating database with subscription:', error);
        }
      }
    },
    onSuperwallEvent: (eventInfo) => {
      const eventName = eventInfo?.event?.event;
      console.log('Superwall event received:', eventInfo.event, eventInfo.params);
      if (eventName === 'transactionComplete') {
        console.log('Transaction complete – subscription should update shortly');
      }
    },
  });

  const refreshSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      // In the new API, subscriptionStatus is a property, not a method
      // Use refresh() to update user data if needed
      if (refresh) {
        await refresh();
      }

      // Get status from the hook's subscriptionStatus property
      const status = subscriptionStatus;
      setLocalSubscriptionStatus(status);

      // Check if status is ACTIVE
      const isActive = status?.status === 'ACTIVE';
      setIsSubscribed(isActive);
    } catch (error) {
      console.error('Error refreshing subscription status:', error);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  };

  const identifyUser = async (userId, userAttributes = {}) => {
    try {
      await identify(userId);

      if (Object.keys(userAttributes).length > 0) {
        await update(userAttributes);
      }

      console.log('User identified with Superwall:', userId);
    } catch (error) {
      console.error('Error identifying user with Superwall:', error);
    }
  };

  // Initialize user and check subscription status
  useEffect(() => {
    const initializeSuperwallUser = async () => {
      try {
        const { data: { user } } = await getSessionUser();
        
        if (user) {
          // These are independent, so run them together instead of one after another.
          // checkUserProStatus self-heals an expired comp grant (referral code / free-month
          // offer) early each session, and warms the cache every feature gate reads.
          await Promise.all([
            identifyUser(user.id, { email: user.email }),
            migrateFromIAPToSuperwall(),
            checkUserProStatus(),
          ]);

          // Get subscription status
          await refreshSubscriptionStatus();
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing Superwall user:', error);
        setIsLoading(false);
      }
    };

    initializeSuperwallUser();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await identifyUser(session.user.id, {
          email: session.user.email,
        });
        await refreshSubscriptionStatus();
      } else if (event === 'SIGNED_OUT') {
        setIsSubscribed(false);
        setLocalSubscriptionStatus(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    isSubscribed,
    subscriptionStatus: localSubscriptionStatus,
    isLoading,
    refreshSubscriptionStatus,
    identifyUser,
  };

  return (
    <SuperwallContext.Provider value={value}>
      {children}
    </SuperwallContext.Provider>
  );
};