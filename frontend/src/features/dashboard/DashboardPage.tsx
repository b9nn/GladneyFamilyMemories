import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useDashboardStats } from './hooks/useDashboard';

interface StatCardProps {
  label: string;
  value: number;
  to: string;
}

function StatCard({ label, value, to }: StatCardProps) {
  return (
    <Link
      to={to}
      className="block rounded-lg border border-border bg-card p-6 hover:bg-accent transition-colors"
    >
      <p className="text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </Link>
  );
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const { data: stats } = useDashboardStats();

  const greeting = user?.full_name ?? user?.username ?? 'there';

  return (
    <div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Hello, {greeting}</h1>
        <p className="mt-1 text-muted-foreground">Welcome to LandTG Memories</p>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Vignettes" value={stats.vignettes} to="/vignettes" />
          <StatCard label="Photos" value={stats.photos} to="/photos" />
          <StatCard label="Audio" value={stats.audio_recordings} to="/audio" />
          <StatCard label="Files" value={stats.files} to="/files" />
          <StatCard label="Family Members" value={stats.family_members} to="/family-tree" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg border border-border bg-muted animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}
