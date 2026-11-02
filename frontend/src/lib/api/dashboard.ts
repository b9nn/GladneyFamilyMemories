import { client } from './client'
import type { DashboardIntro, DashboardStats } from '@/types/api'

interface BackgroundResponse {
  url: string | null
}

export const dashboardApi = {
  getStats: () => client.get<DashboardStats>('/api/dashboard/stats').then(r => r.data),
  getBackground: () => client.get<BackgroundResponse>('/api/dashboard/background').then(r => r.data),
  getIntro: () => client.get<DashboardIntro>('/api/dashboard/intro').then(r => r.data),
  updateIntro: (data: DashboardIntro) => client.put<DashboardIntro>('/api/admin/dashboard-intro', data).then(r => r.data),
}
