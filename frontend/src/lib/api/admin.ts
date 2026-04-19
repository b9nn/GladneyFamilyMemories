import { client } from './client'
import type { User, UserAdminUpdate, InviteCode, InviteCodeCreate, SmtpConfig, SmtpConfigResponse } from '@/types/api'
export const adminApi = {
  listUsers: () => client.get<User[]>('/api/admin/users').then(r => r.data),
  updateUser: (id: number, data: UserAdminUpdate) => client.put<User>(`/api/admin/users/${id}`, data).then(r => r.data),
  listInviteCodes: () => client.get<InviteCode[]>('/api/admin/invite-codes').then(r => r.data),
  createInviteCode: (data: InviteCodeCreate) => client.post<InviteCode>('/api/admin/invite-codes', data).then(r => r.data),
  sendInvite: (email: string, name: string) => client.post<InviteCode>('/api/admin/invite-codes/send', { email, name }).then(r => r.data),
  deleteInviteCode: (id: number) => client.delete(`/api/admin/invite-codes/${id}`).then(r => r.data),
  deleteUser: (id: number) => client.delete(`/api/admin/users/${id}`).then(r => r.data),
  uploadBackground: (file: File) => { const form = new FormData(); form.append('file', file); return client.post('/api/admin/background', form).then(r => r.data) },
  getDashboardStats: () => client.get('/api/dashboard/stats').then(r => r.data),
  getBackground: () => client.get('/api/dashboard/background').then(r => r.data),
  getSmtpConfig: () => client.get<SmtpConfigResponse>('/api/admin/smtp-config').then(r => r.data),
  updateSmtpConfig: (data: SmtpConfig) => client.put<SmtpConfigResponse>('/api/admin/smtp-config', data).then(r => r.data),
  testSmtpConfig: () => client.post<{ message: string }>('/api/admin/smtp-config/test').then(r => r.data),
}
