import { supabase } from '../../lib/supabase';
import { fetchSubscriptionStatus, isExpoGo } from '../../utils/superwallCompat';
import { HARD_PAYWALL_ENABLED, HARD_PAYWALL_GRANDFATHER_BEFORE } from '../../constants/accessConfig';
import { checkUserProStatus } from './subscriptionService';
import { decideAccess } from './accessGate';

export const getAccessDecision = async (): Promise<'allow' | 'paywall'> => {
  // Expo Go runs a mock Superwall and cannot buy anything, so the gate would only block development
  if (!HARD_PAYWALL_ENABLED || isExpoGo()) return 'allow';

  const [dbPro, sdkStatus, sessionResult] = await Promise.all([
    checkUserProStatus(),
    fetchSubscriptionStatus(),
    supabase.auth.getSession(),
  ]);

  // The SDK answer is immediate after a purchase, while users.is_pro waits on the webhook
  const isPro = dbPro || sdkStatus?.status === 'ACTIVE';

  return decideAccess(
    { isPro, accountCreatedAt: sessionResult.data.session?.user?.created_at },
    { enabled: HARD_PAYWALL_ENABLED, grandfatherBefore: HARD_PAYWALL_GRANDFATHER_BEFORE }
  );
};
