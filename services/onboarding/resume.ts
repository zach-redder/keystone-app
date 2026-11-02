export const PRE_AUTH_RESUME_KEY = 'onboarding_resume_route';
export const POST_SIGNUP_KEY = 'post_signup_pending';

const PRE_AUTH_ROUTES: (string | RegExp)[] = [
  /^\/onboarding\/Quiz\/[1-4]$/,
  '/onboarding/CoreValues',
  '/onboarding/LifeGoals',
  '/onboarding/FutureSelfVision',
  '/onboarding/HearYou',
  '/onboarding/Preview',
  '/register',
];

const POST_SIGNUP_ROUTES = [
  '/onboarding/NotificationPermission',
  '/onboarding/AppRating',
  '/onboarding/KeysReady',
  '/onboarding/FreeTrial',
];

// Stored routes are only ever redirected to if they match an allow-list exactly
export const resolvePreAuthResume = (saved?: string | null): string | null => {
  if (!saved) return null;
  const match = PRE_AUTH_ROUTES.some((route) => (typeof route === 'string' ? route === saved : route.test(saved)));
  return match ? saved : null;
};

export const resolvePostSignupResume = (saved?: string | null): string | null =>
  saved && POST_SIGNUP_ROUTES.includes(saved) ? saved : null;
