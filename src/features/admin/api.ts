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

  console.debug('[inviteUser] data:', JSON.stringify(data), '| error:', error?.message)

  // When the edge function returns non-2xx, `error` is set and `data` holds
  // the parsed response body — read the message from there first.
  if (error) {
    const message = data?.message || data?.error || error.message || 'Erro ao enviar convite.'
    throw new Error(message)
  }

  // 2xx but the body signals a logical error
  if (data?.error || data?.message) {
    throw new Error(data.message || data.error)
  }
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
