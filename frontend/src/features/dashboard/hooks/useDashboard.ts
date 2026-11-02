import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard';
import { toast } from '@/stores/toast-store';
import { apiErrorMessage } from '@/lib/utils/api';
import type { DashboardIntro } from '@/types/api';

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

export function useDashboardIntro() {
  return useQuery({
    queryKey: ['dashboard', 'intro'],
    queryFn: dashboardApi.getIntro,
  });
}

export function useUpdateDashboardIntro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DashboardIntro) => dashboardApi.updateIntro(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dashboard', 'intro'] }); toast('Introduction saved', 'success'); },
    onError: (err) => toast(apiErrorMessage(err, 'Failed to save introduction'), 'error'),
  });
}
