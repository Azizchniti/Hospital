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
  const response = await supabase.functions.invoke('invite-user', { body: params })

  if (response.error) {
    // supabase.functions.invoke wraps the actual body inside error.context
    let message = 'Erro ao enviar convite.'
    try {
      const body = await response.error.context?.json()
      message = body?.message || body?.error || message
    } catch {
      message = response.error.message || message
    }
    throw new Error(message)
  }

  if (response.data?.error || response.data?.message) {
    throw new Error(response.data.message || response.data.error)
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
