import { supabase } from '../lib/supabase'

export interface Message {
  id?: string;
  user_id: string;
  type: 'contact' | 'report';
  subject: string;
  message: string;
  created_at?: string;
}

export const submitMessage = async (type: 'contact' | 'report', subject: string, message: string) => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('User not authenticated')

  const { data, error } = await supabase.from('messages').insert([
    {
      user_id: user.id,
      type,
      subject,
      message,
    },
  ])
  if (error) throw error
  return data
}

export const getUserMessages = async () => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
