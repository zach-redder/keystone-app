import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { shouldRequestReview } from './reviewPromptPolicy';

const HISTORY_KEY = 'review_prompt_history';
// Lets a sheet that just closed finish animating before the system prompt appears over it
const PRESENT_DELAY_MS = 1200;

const readHistory = async (): Promise<number[]> => {
  try {
    const stored = await AsyncStorage.getItem(HISTORY_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter((at) => typeof at === 'number') : [];
  } catch {
    return [];
  }
};

/**
 * Asks for an App Store rating with Apple's built-in prompt, at most a few times a year, and only
 * from a moment the user just had a good experience (a key review they accepted, a streak milestone).
 * The OS decides whether to actually show it, so a request is recorded either way.
 */
export const maybeRequestReview = async (): Promise<void> => {
  try {
    const now = Date.now();
    const history = await readHistory();
    if (!shouldRequestReview(history, now)) return;
    if (!(await StoreReview.isAvailableAsync())) return;

    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([...history, now]));
    setTimeout(() => {
      StoreReview.requestReview().catch(() => console.warn('Could not show the review prompt'));
    }, PRESENT_DELAY_MS);
  } catch {
    // A rating prompt must never get in the way of what the user was doing
    console.warn('Could not check whether to ask for a review');
  }
};
