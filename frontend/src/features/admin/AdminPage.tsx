import { useRef, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAdminUsers, useUpdateUser, useInviteCodes, useCreateInviteCode, useDeleteInviteCode, useUploadBackground } from './hooks/useAdmin';
import { formatDate } from '@/lib/utils/date';
import type { User } from '@/types/api';

function UsersSection() {
  const { data: users, isLoading } = useAdminUsers();
  const updateUser = useUpdateUser();

  function toggle(user: User, field: 'is_active' | 'is_admin') {
    if (!confirm(`Set ${field === 'is_admin' ? 'admin' : 'active'} = ${!user[field]} for ${user.username}?`)) return;
    updateUser.mutate({ id: user.id, data: { [field]: !user[field] } });
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-4">Users</h2>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg border border-border bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border divide-y divide-border">
          {users?.map((user) => (
            <div key={user.id} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {user.username}
                  {user.full_name && <span className="text-muted-foreground ml-2">({user.full_name})</span>}
                </p>
                <p className="text-xs text-muted-foreground">{user.email ?? 'No email'} · Joined {formatDate(user.created_at)}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => toggle(user, 'is_admin')}
                  className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                    user.is_admin
                      ? 'bg-primary/10 text-primary hover:bg-destructive/10 hover:text-destructive'
                      : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  {user.is_admin ? 'Admin' : 'User'}
                </button>
                <button
                  onClick={() => toggle(user, 'is_active')}
                  className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                    user.is_active
                      ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {user.is_active ? 'Active' : 'Disabled'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function InviteCodesSection() {
  const { data: codes, isLoading } = useInviteCodes();
  const create = useCreateInviteCode();
  const remove = useDeleteInviteCode();
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<number | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await create.mutateAsync({ email: email || undefined });
      setEmail('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create invite code');
    } finally {
      setCreating(false);
    }
  }

  function copyCode(id: number, code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-4">Invite Codes</h2>
      <form onSubmit={handleCreate} className="flex gap-3 mb-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (optional)"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
        >
          {creating ? 'Creating…' : 'Generate code'}
        </button>
      </form>
      {error && (
        <div className="mb-3 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
      )}
      {isLoading ? (
        <div className="h-20 rounded-lg border border-border bg-muted animate-pulse" />
      ) : !codes?.length ? (
        <p className="text-sm text-muted-foreground">No invite codes yet.</p>
      ) : (
        <div className="rounded-lg border border-border divide-y divide-border">
          {codes.map((code) => (
            <div key={code.id} className="flex items-center gap-3 px-4 py-3">
              <code className="flex-1 text-sm font-mono text-foreground bg-muted rounded px-2 py-1 truncate">
                {code.code}
              </code>
              <div className="text-xs text-muted-foreground flex-shrink-0">
                {code.used_by_id ? (
                  <span className="text-muted-foreground">Used</span>
                ) : (
                  <span className="text-green-600 dark:text-green-400">Available</span>
                )}
                {code.email && <span className="ml-2">{code.email}</span>}
              </div>
              <button
                onClick={() => copyCode(code.id, code.code)}
                className="text-xs text-primary hover:underline flex-shrink-0"
              >
                {copied === code.id ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => remove.mutate(code.id)}
                className="text-xs text-muted-foreground hover:text-destructive flex-shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
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
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-4">Dashboard Background</h2>
      {error && (
        <div className="mb-3 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
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
          <span className="text-sm text-green-600 dark:text-green-400">Uploaded successfully</span>
        )}
        <input ref={fileRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleChange} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Recommended: landscape image, at least 1200×400px</p>
    </section>
  );
}

export function AdminPage() {
  return (
    <div className="space-y-10 max-w-3xl">
      <PageHeader title="Admin" description="Manage users, invite codes, and settings" />
      <UsersSection />
      <InviteCodesSection />
      <BackgroundSection />
    </div>
  );
}
