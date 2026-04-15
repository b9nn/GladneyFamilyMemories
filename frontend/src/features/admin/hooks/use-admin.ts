import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/lib/api/admin'
import type { InviteCodeCreate } from '@/types/api'

export function useUsers() {
  return useQuery({ queryKey: ['admin', 'users'], queryFn: adminApi.listUsers })
}

export function useInviteCodes() {
  return useQuery({ queryKey: ['admin', 'invite-codes'], queryFn: adminApi.listInviteCodes })
}

export function useCreateInviteCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: InviteCodeCreate) => adminApi.createInviteCode(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'invite-codes'] }),
  })
}

export function useDeleteInviteCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteInviteCode(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'invite-codes'] }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useUpdateUsername() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, username }: { userId: number; username: string }) =>
      adminApi.updateUsername(userId, username),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useBackground() {
  return useQuery({ queryKey: ['background'], queryFn: adminApi.getBackground })
}

export function useUploadBackground() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => adminApi.uploadBackground(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['background'] }),
  })
}

export function useDeleteBackground() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteBackground(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['background'] }),
  })
}

export function useMistaggedFiles() {
  return useQuery({ queryKey: ['admin', 'mistagged'], queryFn: adminApi.getMistaggedFiles })
}

export function useFixFileSources() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => adminApi.fixFileSources(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'mistagged'] }),
  })
}
