import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useSyncCurrentUser } from '@/features/auth/hooks/useSyncCurrentUser';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  useSyncCurrentUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !user?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
