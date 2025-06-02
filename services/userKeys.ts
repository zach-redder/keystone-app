import { supabase } from '../lib/supabase'

export const addIdentityKey = async (category: string, title: string, description: string) => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('User not authenticated')

  const { data, error } = await supabase.from('identity_keys').insert([
    {
      user_id: user.id,
      category,
      title,
      description,
    },
  ])
  if (error) throw error
  return data
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
