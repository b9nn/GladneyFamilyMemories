import { client } from './client'
import type { TokenResponse, User, UserLogin, UserRegister, PasswordChange, ForgotPasswordRequest, ResetPasswordRequest } from '@/types/api'
export const authApi = {
  login: (data: UserLogin) => client.post<TokenResponse>('/api/auth/login', data).then(r => r.data),
  register: (data: UserRegister) => client.post<TokenResponse>('/api/auth/register', data).then(r => r.data),
  me: () => client.get<User>('/api/auth/me').then(r => r.data),
  changePassword: (data: PasswordChange) => client.put('/api/users/me/password', data).then(r => r.data),
  forgotPassword: (data: ForgotPasswordRequest) =>
    client.post<{ message: string }>('/api/auth/forgot-password', data).then(r => r.data),
  resetPassword: (data: ResetPasswordRequest) =>
    client.post<{ message: string }>('/api/auth/reset-password', data).then(r => r.data),
}
