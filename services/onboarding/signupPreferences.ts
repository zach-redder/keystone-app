import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildDefaultPreferences } from './defaultPreferences';

const FINAL_PREFERENCES_KEY = 'final_preferences';

// Saved so the email-confirmation screen, which may run in a later app session, sees the same values
export const getSignupPreferences = async () => {
  const saved = await AsyncStorage.getItem(FINAL_PREFERENCES_KEY);
  if (saved) return JSON.parse(saved);

  const defaults = buildDefaultPreferences(await AsyncStorage.getItem('onboarding_nudge'));
  await AsyncStorage.setItem(FINAL_PREFERENCES_KEY, JSON.stringify(defaults));
  return defaults;
};
