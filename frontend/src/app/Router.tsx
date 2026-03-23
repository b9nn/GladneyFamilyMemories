import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './Layout';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { VignettesPage } from '@/features/vignettes/VignettesPage';
import { PhotosPage } from '@/features/photos/PhotosPage';
import { AudioPage } from '@/features/audio/AudioPage';
import { FilesPage } from '@/features/files/FilesPage';
import { FamilyTreePage } from '@/features/family-tree/FamilyTreePage';
import { TimelinePage } from '@/features/timeline/TimelinePage';
import { SearchPage } from '@/features/search/SearchPage';
import { AdminPage } from '@/features/admin/AdminPage';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'vignettes', element: <VignettesPage /> },
      { path: 'photos', element: <PhotosPage /> },
      { path: 'audio', element: <AudioPage /> },
      { path: 'files', element: <FilesPage /> },
      { path: 'family-tree', element: <FamilyTreePage /> },
      { path: 'timeline', element: <TimelinePage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'settings/password', element: <ChangePasswordPage /> },
      {
        path: 'admin',
        element: (
          <ProtectedRoute requireAdmin>
            <AdminPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
