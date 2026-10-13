import { supabase } from '../../lib/supabase';

/**
 * The signed-in user, read from the locally stored session.
 *
 * `supabase.auth.getUser()` makes a network round trip to the auth server on every call, and the
 * app used to make about twenty of them during one cold start. The session is already on the device
 * and refreshed automatically, and row-level security still rejects an invalid token on the server,
 * so reading it locally is safe for data access. Keep `getUser()` for the few flows that must
 * confirm the account with the server (sign-in, email change, account deletion).
 *
 * Returns the same `{ data: { user }, error }` shape as `getUser()`, so call sites swap one-for-one.
 */
export const getSessionUser = async () => {
  const { data, error } = await supabase.auth.getSession();
  return { data: { user: data.session?.user ?? null }, error };
};

export const getSessionUserId = async (): Promise<string | null> => {
  const { data: { user } } = await getSessionUser();
  return user?.id ?? null;
};
