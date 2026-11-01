import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/features/auth/stores/auth-store';

// The persisted user is only written at login, so re-fetch it to pick up admin changes such as page access.
export function useSyncCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const user = await authApi.me();
      if (useAuthStore.getState().isAuthenticated) useAuthStore.getState().setUser(user);
      return user;
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchInterval: 1000 * 60 * 5,
  });
}
