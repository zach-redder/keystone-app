export type AccessConfig = { enabled: boolean; grandfatherBefore: string | null };
export type AccessInput = { isPro: boolean; accountCreatedAt?: string | null };

export const decideAccess = ({ isPro, accountCreatedAt }: AccessInput, config: AccessConfig): 'allow' | 'paywall' => {
  if (!config.enabled || isPro) return 'allow';
  if (!config.grandfatherBefore) return 'paywall';

  // An account whose age can't be read is let in: locking out a paying-era user is worse than a free ride
  const createdAt = accountCreatedAt ? Date.parse(accountCreatedAt) : NaN;
  if (Number.isNaN(createdAt)) return 'allow';

  return createdAt < Date.parse(config.grandfatherBefore) ? 'allow' : 'paywall';
};
