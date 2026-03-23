import { client } from './client'
import type { TokenResponse, User, UserLogin, UserRegister, PasswordChange } from '@/types/api'
export const authApi = {
  login: (data: UserLogin) => client.post<TokenResponse>('/api/auth/login', data).then(r => r.data),
  register: (data: UserRegister) => client.post<TokenResponse>('/api/auth/register', data).then(r => r.data),
  me: () => client.get<User>('/api/auth/me').then(r => r.data),
  changePassword: (data: PasswordChange) => client.put('/api/users/me/password', data).then(r => r.data),
}
