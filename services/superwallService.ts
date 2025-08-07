// Deprecated: kept only for legacy subscription screen fallback.
// New integration uses SuperwallAdapter via src/paywall/*.

// Trigger subscription required event for Superwall
export const triggerPaywallEvent = async () => {
  // No-op: events are handled via placements in the gateway
  return;
};

// Check subscription status
export const checkSubscriptionStatus = async () => {
  // Keep legacy behavior minimal; real entitlement check happens elsewhere
  return false;
};

// Handle purchase
export const handlePurchase = async (productId: string) => {
  // The Subscribe screen owns purchase flow; this is a passthrough stub
  return { purchased: false } as any;
};

// Restore purchases
export const restorePurchases = async () => {
  return { restored: false } as any;
};

// Register for Superwall events
export const registerSuperwallEvents = () => {
  // No-op: listeners are registered in src/paywall/superwallEvents
}; 