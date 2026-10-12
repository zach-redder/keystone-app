import { supabase } from '../../lib/supabase'

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

  const { data, error } = await supabase.from('user_keys').insert([
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
  console.log('addIdentityKeysBatch called with keys:', keys);
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.error('User authentication failed:', authError);
    throw new Error('User not authenticated')
  }

  console.log('User authenticated, user ID:', user.id);

  // Map the keys to include user_id
  const keysWithUserId = keys.map(key => ({
    ...key,
    user_id: user.id,
  }));

  console.log('Keys with user ID:', keysWithUserId);

  const { data, error } = await supabase
    .from('user_keys')
    .insert(keysWithUserId)
  
  if (error) {
    console.error('Error inserting user keys:', error);
    throw error;
  }
  
  console.log('Successfully inserted user keys:', data);
  return data;
}

export const updateIdentityKey = async (keyId: string, updates: object) => {
  const { data, error } = await supabase
    .from('user_keys')
    .update(updates)
    .eq('id', keyId)
  if (error) throw error
  return data
}

export const deleteIdentityKey = async (keyId: string) => {
  const { data, error } = await supabase
    .from('user_keys')
    .delete()
    .eq('id', keyId)
  if (error) throw error
  return data
}

export const fetchIdentityKeys = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  const { data, error } = await supabase
    .from('user_keys')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
