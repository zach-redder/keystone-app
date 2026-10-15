import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { getSessionUserId } from '../auth/currentUser';

export const AI_CONSENT_REQUIRED = 'ai_consent_required';

export class AiConsentRequiredError extends Error {
  code = AI_CONSENT_REQUIRED;

  constructor() {
    super('Agree to AI data sharing to use this feature.');
  }
}

// Per user, so a second account on the same device is asked on its own
const localKey = (userId: string) => `ai_consent_at.${userId}`;

/**
 * Whether the signed-in user has agreed to send their messages, keys and voice to the AI provider.
 * The device flag answers instantly; the account (users.ai_consent_at) covers a reinstall or a new
 * device. A missing column or failed read counts as "not agreed", which just shows the prompt again.
 */
export const hasAiConsent = async (): Promise<boolean> => {
  const userId = await getSessionUserId();
  if (!userId) return false;

  if (await AsyncStorage.getItem(localKey(userId))) return true;

  const { data, error } = await supabase.from('users').select('ai_consent_at').eq('id', userId).maybeSingle();
  if (error || !data?.ai_consent_at) return false;

  await AsyncStorage.setItem(localKey(userId), data.ai_consent_at);
  return true;
};

export const grantAiConsent = async (): Promise<void> => {
  const userId = await getSessionUserId();
  if (!userId) throw new Error('User not authenticated');

  const agreedAt = new Date().toISOString();
  await AsyncStorage.setItem(localKey(userId), agreedAt);

  const { error } = await supabase.from('users').update({ ai_consent_at: agreedAt }).eq('id', userId);
  // Agreement still stands on this device; the account copy only matters for a reinstall or new device
  if (error) console.warn('Could not save AI consent to the account');
};

/** Every code path that sends user content to the AI calls this first, whatever the UI did before it. */
export const assertAiConsent = async (): Promise<void> => {
  if (!(await hasAiConsent())) throw new AiConsentRequiredError();
};
