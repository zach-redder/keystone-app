import * as RNIap from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { upgradeUserToPro, downgradeUserToFree } from './auth';

export const productIds = {
  monthly: 'com.reddermedia.keystone.monthly',
  yearly: 'com.reddermedia.keystone.yearly',
  lifetime: 'com.reddermedia.keystone.lifetime',
};

const LIFETIME_SKU = productIds.lifetime;

export interface IapInitCallbacks {
  onProUnlocked: () => Promise<void> | void;
  onPurchaseError?: (error: any) => void;
  onPurchasePending?: (productId: string) => void;
}

let purchaseUpdateSub: any = null;
let purchaseErrorSub: any = null;
let initialized = false;
let cachedProducts: RNIap.Subscription[] = [];

async function validateReceipt(receipt: string, userId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('validate-apple-receipt', {
      body: { receiptData: receipt, userId },
    });
    if (error) {
      console.warn('Receipt validation error:', error);
      return { isPro: false };
    }
    // If server missed lifetime, fallback client-side scan
    if (!data?.is_pro && data?.raw?.latestCount && data?.rawReceipts) {
      const anyLifetime = (data.rawReceipts as any[]).some(r => r.product_id === LIFETIME_SKU);
      if (anyLifetime) return { isPro: true, raw: data };
    }
    return { isPro: !!data?.is_pro, raw: data };
  } catch (e) {
    console.warn('validateReceipt invoke failed', e);
    return { isPro: false };
  }
}

export async function initIap(callbacks: IapInitCallbacks) {
  if (!initialized) {
    try {
      await RNIap.initConnection();
      initialized = true;
    } catch (e) {
      console.warn('IAP init error', e);
    }
    try {
      const subs = await RNIap.getSubscriptions({ skus: Object.values(productIds) });
      cachedProducts = subs || [];
    } catch (e) {
      console.warn('Failed to fetch subscriptions', e);
    }
  }

  // Listeners
  purchaseUpdateSub = RNIap.purchaseUpdatedListener(async (purchase) => {
    try {
      const receipt = purchase.transactionReceipt;
      if (receipt) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { isPro } = await validateReceipt(receipt, user.id);
          if (isPro) {
            await upgradeUserToPro();
            await AsyncStorage.setItem('subscription_complete', 'true');
            await finalizePostPurchasePreferences();
            await callbacks.onProUnlocked();
          }
        }
        if (purchase.transactionId) {
          try {
            await RNIap.finishTransaction({ purchase, isConsumable: false });
          } catch (finishErr) {
            console.warn('finishTransaction error', finishErr);
          }
        }
      } else {
        console.warn('Purchase without receipt', purchase?.productId);
      }
    } catch (err) {
      console.warn('purchaseUpdatedListener error', err);
    }
  });

  purchaseErrorSub = RNIap.purchaseErrorListener((error) => {
    console.warn('purchase error', error);
    callbacks.onPurchaseError?.(error);
  });

  return {
    products: cachedProducts,
    teardown,
  };
}

export async function requestPlanPurchase(plan: keyof typeof productIds) {
  const id = productIds[plan];
  if (!id) throw new Error('Unknown product id');
  if (plan === 'lifetime') {
    return RNIap.requestPurchase({ sku: id });
  }
  return RNIap.requestSubscription({ sku: id });
}

export async function restorePurchases() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { restored: false };
    const purchases = await RNIap.getAvailablePurchases();
    let isPro = false;
    for (const p of purchases) {
      if (p.transactionReceipt) {
        const { isPro: thisPro } = await validateReceipt(p.transactionReceipt, user.id);
        if (thisPro) isPro = true;
      }
    }
    if (isPro) {
      await upgradeUserToPro();
      await AsyncStorage.setItem('subscription_complete', 'true');
      await finalizePostPurchasePreferences();
    } else {
      await downgradeUserToFree();
    }
    return { restored: true, isPro };
  } catch (e) {
    console.warn('restorePurchases error', e);
    return { restored: false, error: e };
  }
}

export async function validateEntitlements() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isPro: false };
    const purchases = await RNIap.getAvailablePurchases();
    let isPro = false;
    for (const p of purchases) {
      if (p.transactionReceipt) {
        // Immediate lifetime shortcut
        if (p.productId === LIFETIME_SKU) {
          isPro = true;
        }
        const { isPro: thisPro } = await validateReceipt(p.transactionReceipt, user.id);
        if (thisPro) isPro = true;
      }
    }
    if (isPro) {
      await upgradeUserToPro();
      await AsyncStorage.setItem('subscription_complete', 'true');
    } else {
      await downgradeUserToFree();
    }
    return { isPro };
  } catch (e) {
    console.warn('validateEntitlements error', e);
    return { isPro: false };
  }
}

export function teardown() {
  try { purchaseUpdateSub?.remove(); } catch {}
  try { purchaseErrorSub?.remove(); } catch {}
  if (initialized) {
    RNIap.endConnection();
    initialized = false;
  }
}

async function finalizePostPurchasePreferences() {
  try {
    const aiPersonality = await AsyncStorage.getItem('ai_personality');
    const finalPreferences = {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notification_opt_in: true,
      preferred_reminder_time: '12:00:00',
      preferred_ai_persona: aiPersonality ? JSON.parse(aiPersonality)[0] : 'Gentle Guide',
    };
    await AsyncStorage.setItem('final_preferences', JSON.stringify(finalPreferences));
  } catch (e) {
    console.warn('finalizePostPurchasePreferences error', e);
  }
}
