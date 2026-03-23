import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/shared/Navbar';
import { Toaster } from '@/components/shared/Toaster';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Toaster />
    </div>
  );
}
