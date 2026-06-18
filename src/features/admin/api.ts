import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Profile[]
}

export async function inviteUser(params: {
  email: string
  full_name: string
  role: 'admin' | 'user'
}): Promise<void> {
  const { data, error } = await supabase.functions.invoke('invite-user', { body: params })
  // supabase.functions.invoke swallows the real error body — unwrap it
  if (error) throw new Error(data?.error ?? error.message)
}

export async function toggleProfileStatus(id: string, is_active: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active })
    .eq('id', id)
  if (error) throw error
}

export async function changeProfileRole(id: string, role: 'admin' | 'user'): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
  if (error) throw error
}
