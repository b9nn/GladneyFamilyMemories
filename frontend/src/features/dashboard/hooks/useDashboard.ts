import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.getStats,
  });
}

export function useDashboardBackground() {
  return useQuery({
    queryKey: ['dashboard', 'background'],
    queryFn: dashboardApi.getBackground,
  });
}
