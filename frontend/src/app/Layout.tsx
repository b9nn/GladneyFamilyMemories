import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/shared/Navbar';
import { Toaster } from '@/components/shared/Toaster';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { useDashboardBackground } from '@/features/dashboard/hooks/useDashboard';
import { CommandPalette } from '@/features/search/CommandPalette';

export function Layout() {
  const location = useLocation();
  const { data: bg } = useDashboardBackground();
  const showBanner = bg?.url != null && location.pathname !== '/family-tree';

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col"
      style={showBanner && bg?.url ? {
        backgroundImage: `url(${bg.url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      } : undefined}
    >
      <Navbar />
      {showBanner && <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />}
      <main className="relative z-10 flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 pb-20">
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-blue-700 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between text-xs text-white">
          <span>All Rights Reserved</span>
          <span>Website by Ben and Tom Gladney</span>
        </div>
      </footer>
      <Toaster />
      <CommandPalette />
    </div>
  );
}
