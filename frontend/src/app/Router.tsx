import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { usePageAccess, type PageKey } from '@/lib/utils/usePageAccess';

function PageGuard({ page, children }: { page: PageKey; children: React.ReactNode }) {
  const canAccess = usePageAccess();
  if (!canAccess(page)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const LoginPage = lazy(() => import('@/features/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('@/features/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/features/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const ChangePasswordPage = lazy(() => import('@/features/auth/ChangePasswordPage').then(m => ({ default: m.ChangePasswordPage })));
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const VignettesPage = lazy(() => import('@/features/vignettes/VignettesPage').then(m => ({ default: m.VignettesPage })));
const PhotosPage = lazy(() => import('@/features/photos/PhotosPage').then(m => ({ default: m.PhotosPage })));
const AudioPage = lazy(() => import('@/features/audio/AudioPage').then(m => ({ default: m.AudioPage })));
const FilesPage = lazy(() => import('@/features/files/FilesPage').then(m => ({ default: m.FilesPage })));
const TimelinePage = lazy(() => import('@/features/timeline/TimelinePage').then(m => ({ default: m.TimelinePage })));
const SearchPage = lazy(() => import('@/features/search/SearchPage').then(m => ({ default: m.SearchPage })));
const AdminPage = lazy(() => import('@/features/admin/AdminPage').then(m => ({ default: m.AdminPage })));
const WeddingPage = lazy(() => import('@/features/wedding/WeddingPage').then(m => ({ default: m.WeddingPage })));

function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-md bg-muted" />
      <div className="h-4 w-72 rounded-md bg-muted" />
      <div className="h-40 rounded-lg bg-muted" />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Suspense fallback={null}><LoginPage /></Suspense>,
  },
  {
    path: '/register',
    element: <Suspense fallback={null}><RegisterPage /></Suspense>,
  },
  {
    path: '/forgot-password',
    element: <Suspense fallback={null}><ForgotPasswordPage /></Suspense>,
  },
  {
    path: '/reset-password',
    element: <Suspense fallback={null}><ResetPasswordPage /></Suspense>,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Suspense fallback={<PageSkeleton />}><DashboardPage /></Suspense> },
      { path: 'vignettes', element: <PageGuard page="vignettes"><Suspense fallback={<PageSkeleton />}><VignettesPage /></Suspense></PageGuard> },
      { path: 'photos', element: <PageGuard page="photos"><Suspense fallback={<PageSkeleton />}><PhotosPage /></Suspense></PageGuard> },
      { path: 'audio', element: <PageGuard page="audio"><Suspense fallback={<PageSkeleton />}><AudioPage /></Suspense></PageGuard> },
      { path: 'files', element: <PageGuard page="files"><Suspense fallback={<PageSkeleton />}><FilesPage /></Suspense></PageGuard> },
      { path: 'timeline', element: <PageGuard page="timeline"><Suspense fallback={<PageSkeleton />}><TimelinePage /></Suspense></PageGuard> },
      { path: 'search', element: <PageGuard page="search"><Suspense fallback={<PageSkeleton />}><SearchPage /></Suspense></PageGuard> },
      { path: 'wedding', element: <PageGuard page="wedding"><Suspense fallback={<PageSkeleton />}><WeddingPage /></Suspense></PageGuard> },
      { path: 'settings/password', element: <Suspense fallback={<PageSkeleton />}><ChangePasswordPage /></Suspense> },
      {
        path: 'admin',
        element: (
          <ProtectedRoute requireAdmin>
            <Suspense fallback={<PageSkeleton />}><AdminPage /></Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
