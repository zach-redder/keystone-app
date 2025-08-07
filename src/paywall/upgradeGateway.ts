type NavigationLike = { navigate?: (route: string, params?: any) => void; push?: (route: string, params?: any) => void };
import { SuperwallAdapter as SW } from './superwallAdapter';

export type UpgradeParams = { returnTo?: string } & Record<string, any>;

// Hook wrapper for calling from components with access to hooks
export function useUpgradeGateway() {
  const openUpgradeGateway = async (
    navigation: NavigationLike,
    params?: UpgradeParams
  ) => {
    try {
      const result = await SW.present('upsell', { params });
      // If Superwall did not present (holdout/targeting/error), route to fallback
      if (!result?.presented) {
        if ('navigate' in (navigation as any)) {
          (navigation as any).navigate('subscription', params);
        } else if ('push' in (navigation as any)) {
          (navigation as any).push('/subscription', params);
        }
      }
    } catch {
      if ('navigate' in (navigation as any)) {
        (navigation as any).navigate('subscription', params);
      } else if ('push' in (navigation as any)) {
        (navigation as any).push('/subscription', params);
      }
    }
  };

  return { openUpgradeGateway };
}

// Non-hook helper for places where we cant use hooks (e.g., standalone modules)
export async function openUpgradeGateway(
  navigation: NavigationLike,
  params?: UpgradeParams
) {
  // This non-hook version cannot access useSuperwall; it should be called from UI contexts.
  try {
    const result = await SW.present('upsell', { params });
    if (!result?.presented) {
      if ('navigate' in (navigation as any)) {
        (navigation as any).navigate('subscription', params);
      } else if ('push' in (navigation as any)) {
        (navigation as any).push('/subscription', params);
      }
    }
  } catch {
    if ('navigate' in (navigation as any)) {
      (navigation as any).navigate('subscription', params);
    } else if ('push' in (navigation as any)) {
      (navigation as any).push('/subscription', params);
    }
  }
}

