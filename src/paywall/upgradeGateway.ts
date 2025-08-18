type NavigationLike = { navigate?: (route: string, params?: any) => void; push?: (route: string, params?: any) => void };

export type UpgradeParams = { returnTo?: string } & Record<string, any>;

function routeToSubscription(navigation: NavigationLike, params?: UpgradeParams) {
  if ('navigate' in (navigation as any)) {
    (navigation as any).navigate('subscription', params);
  } else if ('push' in (navigation as any)) {
    (navigation as any).push('/subscription', params);
  }
}

// Hook wrapper retained for backward compatibility. Simply routes to subscription screen now.
export function useUpgradeGateway() {
  const openUpgradeGateway = async (
    navigation: NavigationLike,
    params?: UpgradeParams
  ) => {
    routeToSubscription(navigation, params);
  };

  return { openUpgradeGateway };
}

// Non-hook helper. Direct navigation only.
export async function openUpgradeGateway(
  navigation: NavigationLike,
  params?: UpgradeParams
) {
  // Intentionally not calling the hook closure for clarity.
  routeToSubscription(navigation, params);
}

