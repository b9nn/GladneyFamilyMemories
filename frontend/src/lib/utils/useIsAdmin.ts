import { useAuthStore } from '@/features/auth/stores/auth-store';

export function useIsAdmin(): boolean {
  return useAuthStore((s) => s.user?.is_admin ?? false);
}
