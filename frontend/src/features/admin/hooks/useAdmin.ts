import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { toast } from '@/stores/toast-store';
import type { UserAdminUpdate, InviteCodeCreate } from '@/types/api';

export function useAdminUsers() {
  return useQuery({ queryKey: ['admin', 'users'], queryFn: adminApi.listUsers });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserAdminUpdate }) => adminApi.updateUser(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); toast('User updated', 'success'); },
  });
}

export function useInviteCodes() {
  return useQuery({ queryKey: ['admin', 'invite-codes'], queryFn: adminApi.listInviteCodes });
}

export function useCreateInviteCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InviteCodeCreate) => adminApi.createInviteCode(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'invite-codes'] }); toast('Invite code created', 'success'); },
  });
}

export function useDeleteInviteCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteInviteCode(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'invite-codes'] }); toast('Invite code deleted', 'success'); },
  });
}

export function useUploadBackground() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => adminApi.uploadBackground(file),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dashboard', 'background'] }); toast('Background image updated', 'success'); },
  });
}
