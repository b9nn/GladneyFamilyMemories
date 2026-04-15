import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { useThemeStore } from '@/stores/theme-store'
import { adminApi } from '@/lib/api/admin'
import type { BackgroundImage } from '@/types/api'

export function Layout() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore()
  const initializeTheme = useThemeStore((s) => s.initialize)
  const [background, setBackground] = useState<BackgroundImage | null>(null)

  useEffect(() => {
    initialize()
    initializeTheme()
  }, [initialize, initializeTheme])

  useEffect(() => {
    if (isAuthenticated) {
      adminApi.getBackground().then(setBackground)
    }
  }, [isAuthenticated])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={
        background?.url
          ? {
              backgroundImage: `url(${background.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
            }
          : undefined
      }
    >
      {background?.url && (
        <div className="fixed inset-0 bg-background/85 -z-10" />
      )}
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}
