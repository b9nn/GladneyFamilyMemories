import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, type ReactNode } from 'react'
import { Layout } from './layout'
import { LoginPage } from '@/features/auth/page'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { Skeleton } from '@/components/ui/skeleton'

const DashboardPage = lazy(() => import('@/features/dashboard/page'))
const VignettesPage = lazy(() => import('@/features/vignettes/page'))
const PhotosPage = lazy(() => import('@/features/photos/page'))
const AudioPage = lazy(() => import('@/features/audio/page'))
const FilesPage = lazy(() => import('@/features/files/page'))
const AdminPage = lazy(() => import('@/features/admin/page'))
const ChangePasswordPage = lazy(() => import('@/features/auth/change-password-page'))
const FamilyTreePage = lazy(() => import('@/features/family-tree/page'))
const TimelinePage = lazy(() => import('@/features/timeline/page'))
const SearchPage = lazy(() => import('@/features/search/page'))

function PageFallback() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) return null // Layout handles the loading spinner
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user?.is_admin) return <Navigate to="/" replace />
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/vignettes" element={<ProtectedRoute><VignettesPage /></ProtectedRoute>} />
          <Route path="/photos" element={<ProtectedRoute><PhotosPage /></ProtectedRoute>} />
          <Route path="/audio" element={<ProtectedRoute><AudioPage /></ProtectedRoute>} />
          <Route path="/files" element={<ProtectedRoute><FilesPage /></ProtectedRoute>} />
          <Route path="/family-tree" element={<ProtectedRoute><FamilyTreePage /></ProtectedRoute>} />
          <Route path="/timeline" element={<ProtectedRoute><TimelinePage /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
