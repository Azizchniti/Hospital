import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { fetchProfiles, inviteUser, toggleProfileStatus, changeProfileRole } from './api'

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: fetchProfiles,
  })
}

export function useInviteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: inviteUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles'] })
      toast.success('Convite enviado com sucesso!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useToggleProfileStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleProfileStatus(id, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useChangeProfileRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'admin' | 'user' }) =>
      changeProfileRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
    onError: (err: Error) => toast.error(err.message),
  })
}
