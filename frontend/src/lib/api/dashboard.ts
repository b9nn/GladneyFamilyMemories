import { client } from './client'
import type { DashboardStats } from '@/types/api'

interface BackgroundResponse {
  url: string | null
}

export const dashboardApi = {
  getStats: () => client.get<DashboardStats>('/api/dashboard/stats').then(r => r.data),
  getBackground: () => client.get<BackgroundResponse>('/api/dashboard/background').then(r => r.data),
}
