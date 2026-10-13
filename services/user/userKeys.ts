import { getSessionUser } from '../auth/currentUser';
import { supabase } from '../../lib/supabase'
import { queryClient, queryKeys } from '../../lib/queryClient'

export interface IdentityKey {
  category: string;
  description: string;
}

const KEYS_STALE_MS = 5 * 60 * 1000;

// Every write below calls this so the cached list never outlives a change
const invalidateKeys = () => queryClient.invalidateQueries({ queryKey: queryKeys.identityKeys })

export const addIdentityKey = async (category: string, description: string) => {
  const {
    data: { user },
    error: authError,
  } = await getSessionUser()
  if (authError || !user) throw new Error('User not authenticated')

  const { data, error } = await supabase.from('user_keys').insert([
    {
      user_id: user.id,
      category,
      description,
    },
  ])
  if (error) throw error
  await invalidateKeys()
  return data
}

export const addIdentityKeysBatch = async (keys: IdentityKey[]) => {
  const {
    data: { user },
    error: authError,
  } = await getSessionUser()

  if (authError || !user) {
    console.error('User authentication failed:', authError);
    throw new Error('User not authenticated')
  }

  const keysWithUserId = keys.map(key => ({
    ...key,
    user_id: user.id,
  }));

  const { data, error } = await supabase
    .from('user_keys')
    .insert(keysWithUserId)

  if (error) {
    console.error('Error inserting user keys:', error);
    throw error;
  }

  await invalidateKeys()
  return data;
}

export const updateIdentityKey = async (keyId: string, updates: object) => {
  const { data, error } = await supabase
    .from('user_keys')
    .update(updates)
    .eq('id', keyId)
  if (error) throw error
  await invalidateKeys()
  return data
}

export const deleteIdentityKey = async (keyId: string) => {
  const { data, error } = await supabase
    .from('user_keys')
    .delete()
    .eq('id', keyId)
  if (error) throw error
  await invalidateKeys()
  return data
}

export const loadIdentityKeys = async () => {
  const {
    data: { user },
  } = await getSessionUser()
  if (!user) throw new Error('User not authenticated')
  const { data, error } = await supabase
    .from('user_keys')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Cached: chat, voice, stats and the Keys tab all read the same list
export const fetchIdentityKeys = () =>
  queryClient.fetchQuery({
    queryKey: queryKeys.identityKeys,
    queryFn: loadIdentityKeys,
    staleTime: KEYS_STALE_MS,
  })
