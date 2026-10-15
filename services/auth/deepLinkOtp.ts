// Which token_hash `type` each auth-link path may carry, matching how keystone-landingpage's /verify
// routes them (signup -> emailconfirmation, email_change -> signin, recovery -> resetpassword).
// The type comes from a link anyone can craft, so it is never passed to verifyOtp unchecked, whether
// the link arrived as keystone:// (app/_layout.js) or as a universal link (app/(auth)/verify.js).
// A Map, not an object: the path is derived from a URL, and "__proto__" must not resolve to anything.
const OTP_TYPES_BY_PATH = new Map<string, string[]>([
  ['emailconfirmation', ['signup', 'email']],
  ['signin', ['email_change', 'email']],
  ['resetpassword', ['recovery']],
]);

export const isOtpTypeAllowedForPath = (path: string, type: string): boolean =>
  OTP_TYPES_BY_PATH.get(path)?.includes(type) ?? false;

// A PKCE password-reset link arrives as a bare `code`, indistinguishable from a sign-up confirmation, so
// the landing page and the universal-link route both send it to `emailconfirmation`, which would sign the
// user in without ever asking for a new password. supabase-js remembers which flow started the code and
// reports it as `redirectType` when the code is exchanged, so a reset is sent on to the new-password screen.
export const authLinkDestination = (path: string, redirectType: string | null | undefined): string =>
  redirectType === 'PASSWORD_RECOVERY' ? 'resetpassword' : path;
