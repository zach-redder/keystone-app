import { useEffect } from 'react';
import { markPostSignupStep, markPreAuthStep } from '../services/onboarding/resumeStorage';

const save = (mark, route) => {
  mark(route).catch((error) => console.error('Error saving onboarding progress:', error));
};

// Before the account exists: a killed app reopens on this screen instead of Welcome
export function usePreAuthResume(route) {
  useEffect(() => {
    save(markPreAuthStep, route);
  }, [route]);
}

// After the account exists: notifications, rating and paywall still follow
export function usePostSignupResume(route) {
  useEffect(() => {
    save(markPostSignupStep, route);
  }, [route]);
}
