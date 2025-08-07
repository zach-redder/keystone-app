import Constants from 'expo-constants';

type ConfigureOptions = { apiKey: string; logging?: 'debug' | 'error' };
type IdentifyProps = Record<string, any> | undefined;
type PresentOptions = { params?: Record<string, any> } | undefined;
type PresentResult = { presented: boolean } | undefined;
type EventName = string;
type EventCallback = (event: any) => void;

const IS_EXPO_GO = Constants.appOwnership === 'expo';
// Enable Superwall automatically whenever we're not in Expo Go
const ENABLE_SW = !IS_EXPO_GO;

async function getModule(): Promise<any | null> {
  if (IS_EXPO_GO || !ENABLE_SW) return null;
  try {
    // Lazy import to avoid crashing in Expo Go
    const mod = await import('expo-superwall');
    return mod;
  } catch (e) {
    console.warn('Superwall module not available:', e);
    return null;
  }
}

export const SuperwallAdapter = {
  IS_EXPO_GO,
  ENABLE_SW,

  async configure(opts: ConfigureOptions): Promise<void> {
    const mod = await getModule();
    if (!mod) return;
    try {
      // Prefer class-style API if available
      if (mod.Superwall?.configure) {
        await mod.Superwall.configure({ apiKey: opts.apiKey, logging: opts.logging });
        return;
      }
      // Fallback: if a default configure exists
      if (typeof mod.configure === 'function') {
        await mod.configure({ apiKey: opts.apiKey, logging: opts.logging });
      }
    } catch (e) {
      console.warn('Superwall.configure failed:', e);
    }
  },

  async identify(userId: string, props?: IdentifyProps): Promise<void> {
    const mod = await getModule();
    if (!mod) return;
    try {
      if (mod.Superwall?.identify) {
        await mod.Superwall.identify(userId, props || {});
        return;
      }
      if (typeof mod.identify === 'function') {
        await mod.identify(userId, props || {});
      }
    } catch (e) {
      console.warn('Superwall.identify failed:', e);
    }
  },

  async present(placement: string, options?: PresentOptions): Promise<PresentResult> {
    const mod = await getModule();
    if (!mod) return { presented: false };
    try {
      if (mod.Superwall?.present) {
        return await mod.Superwall.present(placement, options);
      }
      if (typeof mod.present === 'function') {
        return await mod.present(placement, options);
      }
      // As a last resort, try a placement registration API
      if (typeof mod.registerPlacement === 'function') {
        const res = await mod.registerPlacement({ placement, ...options });
        return res || { presented: !!res };
      }
    } catch (e) {
      console.warn('Superwall.present failed:', e);
    }
    return { presented: false };
  },

  async on(eventName: EventName, cb: EventCallback): Promise<() => void> {
    const mod = await getModule();
    if (!mod) return () => {};
    try {
      if (mod.Superwall?.addEventListener) {
        const sub = mod.Superwall.addEventListener(eventName, cb);
        return () => sub?.remove?.();
      }
      if (typeof mod.addEventListener === 'function') {
        const sub = mod.addEventListener(eventName, cb);
        return () => sub?.remove?.();
      }
    } catch (e) {
      console.warn('Superwall.on failed:', e);
    }
    return () => {};
  },

  async trackEvent(name: string, props?: Record<string, any>): Promise<void> {
    const mod = await getModule();
    if (!mod) return;
    try {
      if (mod.Superwall?.track) {
        await mod.Superwall.track(name, props || {});
        return;
      }
      if (typeof mod.track === 'function') {
        await mod.track(name, props || {});
      }
    } catch (e) {
      console.warn('Superwall.trackEvent failed:', e);
    }
  },
};

export type SuperwallAdapterType = typeof SuperwallAdapter;

