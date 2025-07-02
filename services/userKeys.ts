import { supabase } from '../lib/supabase'

export interface IdentityKey {
  category: string;
  description: string;
}

export const addIdentityKey = async (category: string, description: string) => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('User not authenticated')

  const { data, error } = await supabase.from('identity_keys').insert([
    {
      user_id: user.id,
      category,
      description,
    },
  ])
  if (error) throw error
  return data
}

export const addIdentityKeysBatch = async (keys: IdentityKey[]) => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('User not authenticated')

  // Map the keys to include user_id
  const keysWithUserId = keys.map(key => ({
    ...key,
    user_id: user.id,
  }));

  const { data, error } = await supabase
    .from('identity_keys')
    .insert(keysWithUserId)
  
  if (error) {
    console.error('Error inserting identity keys:', error);
    throw error;
  }
  return data;
}

export const updateIdentityKey = async (keyId: string, updates: object) => {
  const { data, error } = await supabase
    .from('identity_keys')
    .update(updates)
    .eq('id', keyId)
  if (error) throw error
  return data
}

export const fetchIdentityKeys = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('identity_keys')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
