import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useDashboardStats } from './hooks/useDashboard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { toast } from '@/stores/toast-store';
import type { InviteCode, User } from '@/types/api';
import { useAdminUsers, useDeleteUser, useUpdateUser } from '@/features/admin/hooks/useAdmin';
import { formatDate } from '@/lib/utils/date';
import { useUploadBackground } from '@/features/admin/hooks/useAdmin';
import { ALL_PAGES, pageAccessToString, stringToPageAccess, usePageAccess, type PageKey } from '@/lib/utils/usePageAccess';

const PAGE_LABELS: Record<PageKey, string> = {
  vignettes: 'Vignettes', photos: 'Photos', audio: 'Audio',
  files: 'Files', timeline: 'Timeline', search: 'Search', wedding: 'Wedding',
};

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

function UserRow({ u, currentUserId }: { u: User; currentUserId: number | undefined }) {
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const [editingAccess, setEditingAccess] = useState(false);
  const [pages, setPages] = useState<PageKey[]>(stringToPageAccess(u.page_access));

  const accessLabel = u.is_admin
    ? 'All pages (admin)'
    : u.page_access === null
    ? 'All pages'
    : u.page_access.split(',').map((p) => PAGE_LABELS[p.trim() as PageKey] ?? p).join(', ') || 'No pages';

  function handleToggleActive() {
    const action = u.is_active ? 'Deactivate' : 'Reactivate';
    if (!confirm(`${action} ${u.full_name ?? u.username}?`)) return;
    updateUser.mutate({ id: u.id, data: { is_active: !u.is_active } });
  }

  function handleDelete() {
    if (!confirm(`Permanently delete ${u.full_name ?? u.username}? This cannot be undone.`)) return;
    deleteUser.mutate(u.id);
  }

  function saveAccess() {
    updateUser.mutate({ id: u.id, data: { page_access: pageAccessToString(pages) } }, {
      onSuccess: () => setEditingAccess(false),
    });
  }

  const isSelf = u.id === currentUserId;

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground">{u.full_name ?? u.username}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.is_admin ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {u.is_admin ? 'Admin' : 'Member'}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.is_active ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-destructive/15 text-destructive'}`}>
              {u.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {u.email ?? 'No email'} · Joined {formatDate(u.created_at)}
          </p>
          {!u.is_admin && (
            <p className="text-xs text-muted-foreground">Access: {accessLabel}</p>
          )}
        </div>
        {!isSelf && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleToggleActive}
              className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                u.is_active
                  ? 'bg-muted text-muted-foreground hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400'
                  : 'bg-muted text-muted-foreground hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/30 dark:hover:text-green-400'
              }`}
            >
              {u.is_active ? 'Deactivate' : 'Reactivate'}
            </button>
            {!u.is_admin && (
              <button
                onClick={() => { setPages(stringToPageAccess(u.page_access)); setEditingAccess((v) => !v); }}
                className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Pages
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deleteUser.isPending}
              className="text-xs px-2 py-1 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {editingAccess && !u.is_admin && (
        <div className="rounded-md border border-border bg-muted/40 p-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Page access</p>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={pages.length === ALL_PAGES.length}
                onChange={() => setPages(pages.length === ALL_PAGES.length ? [] : [...ALL_PAGES])}
                className="rounded"
              />
              <span className={pages.length === ALL_PAGES.length ? 'text-foreground font-medium' : 'text-muted-foreground'}>All pages</span>
            </label>
            {ALL_PAGES.map((page) => (
              <label key={page} className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={pages.includes(page)}
                  onChange={() => setPages(pages.includes(page) ? pages.filter((p) => p !== page) : [...pages, page])}
                  className="rounded"
                />
                <span className={pages.includes(page) ? 'text-foreground' : 'text-muted-foreground'}>{PAGE_LABELS[page]}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveAccess}
              disabled={updateUser.isPending}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {updateUser.isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setEditingAccess(false)}
              className="rounded-md border border-input px-3 py-1.5 text-xs text-foreground hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UserListSection() {
  const { data: users, isLoading } = useAdminUsers();
  const { user: currentUser } = useAuthStore();

  return (
    <div className="mt-10 rounded-lg border border-border bg-card p-6">
      <h2 className="text-base font-semibold text-foreground mb-4">All Members</h2>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border rounded-md border border-border">
          {users?.map((u) => (
            <UserRow key={u.id} u={u} currentUserId={currentUser?.id} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isError: statsError } = useDashboardStats();
  const isAdmin = user?.is_admin ?? false;
  const canAccess = usePageAccess();

  const greeting = user?.full_name ?? user?.username ?? 'there';

  const statCards = [
    { label: 'Vignettes', key: 'vignettes' as const, to: '/vignettes', page: 'vignettes' as PageKey },
    { label: 'Photos', key: 'photos' as const, to: '/photos', page: 'photos' as PageKey },
    { label: 'Audio', key: 'audio_recordings' as const, to: '/audio', page: 'audio' as PageKey },
    { label: 'Files', key: 'files' as const, to: '/files', page: 'files' as PageKey },
    { label: 'Wedding', key: 'wedding' as const, to: '/wedding', page: 'wedding' as PageKey },
  ].filter(c => canAccess(c.page));

  return (
    <div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Hello, {greeting}</h1>
        <p className="mt-1 text-muted-foreground">Welcome to LandTG Memories</p>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statCards.map(c => (
            <StatCard key={c.key} label={c.label} value={stats[c.key] ?? 0} to={c.to} />
          ))}
        </div>
      ) : statsError ? (
        <p className="text-sm text-muted-foreground">Could not load stats — refresh to try again.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: statCards.length || 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg border border-border bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {isAdmin && <UserListSection />}
      {isAdmin && <BackgroundSection />}
      {isAdmin && <InviteSection />}
    </div>
  );
}
