import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useDashboardStats } from './hooks/useDashboard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { toast } from '@/stores/toast-store';
import type { InviteCode } from '@/types/api';
import { useUploadBackground } from '@/features/admin/hooks/useAdmin';

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

function BackgroundSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadBg = useUploadBackground();
  const [error, setError] = useState('');

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      await uploadBg.mutateAsync(file);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
    e.target.value = '';
  }

  return (
    <div className="mt-6 rounded-lg border border-border bg-card p-6 space-y-3">
      <h2 className="text-base font-semibold text-foreground">Page Background</h2>
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
      )}
      <div className="flex items-center gap-4">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploadBg.isPending}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
        >
          {uploadBg.isPending ? 'Uploading…' : 'Upload background image'}
        </button>
        {uploadBg.isSuccess && (
          <span className="text-sm text-green-600 dark:text-green-400">Updated successfully</span>
        )}
        <input ref={fileRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleChange} />
      </div>
      <p className="text-xs text-muted-foreground">Shown on all pages. Recommended: landscape, at least 1200×400px.</p>
    </div>
  );
}

function InviteSection() {
  const qc = useQueryClient();
  const { data: codes } = useQuery<InviteCode[]>({ queryKey: ['invite-codes'], queryFn: adminApi.listInviteCodes });
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const sendInvite = useMutation({
    mutationFn: () => adminApi.sendInvite(email, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invite-codes'] });
      toast('Invitation sent', 'success');
      setEmail('');
      setName('');
    },
    onError: () => toast('Failed to send invitation', 'error'),
  });

  const deleteCode = useMutation({
    mutationFn: (id: number) => adminApi.deleteInviteCode(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invite-codes'] }),
  });

  const pending = codes?.filter((c) => !c.used_by_id) ?? [];
  const used = codes?.filter((c) => c.used_by_id) ?? [];

  return (
    <div className="mt-10 rounded-lg border border-border bg-card p-6 space-y-6">
      <h2 className="text-base font-semibold text-foreground">Invite a family member</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <button
        onClick={() => sendInvite.mutate()}
        disabled={!email || !name || sendInvite.isPending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
      >
        {sendInvite.isPending ? 'Sending…' : 'Send invitation'}
      </button>

      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Pending invitations</p>
          <div className="divide-y divide-border rounded-md border border-border">
            {pending.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="text-foreground">{c.email ?? '—'}</span>
                <button
                  onClick={() => deleteCode.mutate(c.id)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {used.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Accepted</p>
          <div className="divide-y divide-border rounded-md border border-border">
            {used.map((c) => (
              <div key={c.id} className="px-4 py-2 text-sm text-muted-foreground">
                {c.email ?? '—'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isError: statsError } = useDashboardStats();
  const isAdmin = user?.is_admin ?? false;

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
      ) : statsError ? (
        <p className="text-sm text-muted-foreground">Could not load stats — refresh to try again.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg border border-border bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {isAdmin && <BackgroundSection />}
      {isAdmin && <InviteSection />}
    </div>
  );
}
