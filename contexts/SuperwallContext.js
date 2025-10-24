import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSuperwallImplementation } from '../utils/superwallCompat';
import { supabase } from '../lib/supabase';
import { handleSuperwallPurchaseComplete, migrateFromIAPToSuperwall } from '../services/superwallService';

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
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { identify, setUserAttributes, getSubscriptionStatus } = useUser();

  // Handle Superwall events
  useSuperwallEvents((event) => {
    console.log('Superwall event received:', event.type, event.data);
    
    switch (event.type) {
      case 'transaction_complete':
        handlePurchaseComplete(event.data);
        break;
      case 'subscription_start':
        refreshSubscriptionStatus();
        break;
      case 'subscription_end':
        refreshSubscriptionStatus();
        break;
    }
  });

  const handlePurchaseComplete = async (transactionData) => {
    try {
      await handleSuperwallPurchaseComplete(transactionData);
      await refreshSubscriptionStatus();
    } catch (error) {
      console.error('Error handling purchase completion:', error);
    }
  };

  const refreshSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      const status = await getSubscriptionStatus();
      setSubscriptionStatus(status);
      setIsSubscribed(status?.isActive || false);
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
        await setUserAttributes(userAttributes);
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
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Identify user with Superwall
          await identifyUser(user.id, {
            email: user.email,
          });

          // Check for IAP migration
          await migrateFromIAPToSuperwall();

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
        setSubscriptionStatus(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    isSubscribed,
    subscriptionStatus,
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