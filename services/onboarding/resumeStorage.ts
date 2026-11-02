import AsyncStorage from '@react-native-async-storage/async-storage';
import { POST_SIGNUP_KEY, PRE_AUTH_RESUME_KEY, resolvePostSignupResume, resolvePreAuthResume } from './resume';

export const markPreAuthStep = (route: string) => AsyncStorage.setItem(PRE_AUTH_RESUME_KEY, route);

export const markPostSignupStep = (route: string) => AsyncStorage.setItem(POST_SIGNUP_KEY, route);

export const getPreAuthResume = async () => resolvePreAuthResume(await AsyncStorage.getItem(PRE_AUTH_RESUME_KEY));

export const getPostSignupResume = async () => resolvePostSignupResume(await AsyncStorage.getItem(POST_SIGNUP_KEY));

// Onboarding is over once the paywall step has been handled
export const finishPostSignup = () =>
  AsyncStorage.multiRemove([POST_SIGNUP_KEY, PRE_AUTH_RESUME_KEY, 'onboarding_intent', 'onboarding_nudge']);
