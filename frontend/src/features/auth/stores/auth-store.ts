import { create } from 'zustand'
import type { User } from '@/types/api'
import { authApi } from '@/lib/api/auth'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean

  login: (username: string, password: string) => Promise<User>
  register: (username: string, password: string, email: string, fullName: string, inviteCode: string) => Promise<void>
  logout: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  isAuthenticated: false,

  login: async (username: string, password: string) => {
    const response = await authApi.login(username, password)
    localStorage.setItem('token', response.access_token)
    set({
      token: response.access_token,
      user: response.user,
      isAuthenticated: true,
    })
    return response.user
  },

  register: async (username: string, password: string, email: string, fullName: string, inviteCode: string) => {
    await authApi.register({
      username,
      password,
      email,
      full_name: fullName,
      invite_code: inviteCode,
    })
    // Auto-login after registration
    await get().login(username, password)
  },

  logout: () => {
    localStorage.removeItem('token')
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  initialize: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ isLoading: false })
      return
    }
    try {
      const user = await authApi.me()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.removeItem('token')
      set({ token: null, user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
