import { useRef, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  useAdminUsers, useUpdateUser, useInviteCodes, useCreateInviteCode,
  useDeleteInviteCode, useSendInvite, useUploadBackground,
  useSmtpConfig, useUpdateSmtpConfig, useTestSmtpConfig,
} from './hooks/useAdmin';
import { useVignettes, useDeleteVignette, useUpdateVignette } from '@/features/vignettes/hooks/useVignettes';
import { usePhotos, useDeletePhoto } from '@/features/photos/hooks/usePhotos';
import { useAudioList, useDeleteAudio } from '@/features/audio/hooks/useAudio';
import { useFiles, useDeleteFile } from '@/features/files/hooks/useFiles';
import { formatDate } from '@/lib/utils/date';
import type { User, Vignette, SmtpConfig, SmtpConfigResponse } from '@/types/api';

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

function InviteSection() {
  const { data: codes, isLoading } = useInviteCodes();
  const create = useCreateInviteCode();
  const sendInvite = useSendInvite();
  const remove = useDeleteInviteCode();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [codeOnly, setCodeOnly] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<number | null>(null);

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !name) return;
    setBusy(true);
    setError('');
    try {
      await sendInvite.mutateAsync({ email, name });
      setEmail('');
      setName('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await create.mutateAsync({ email: codeOnly || undefined });
      setCodeOnly('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create invite code');
    } finally {
      setBusy(false);
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
      <h2 className="text-lg font-semibold text-foreground mb-4">Invitations</h2>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        {/* Send email invitation */}
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm font-medium text-foreground mb-3">Send email invitation</p>
          <form onSubmit={handleSend} className="space-y-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Recipient name"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={busy || !email || !name}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {busy ? 'Sending…' : 'Send invitation'}
            </button>
          </form>
        </div>

        {/* Generate code only */}
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm font-medium text-foreground mb-3">Generate code only</p>
          <form onSubmit={handleGenerate} className="space-y-2">
            <input
              type="email"
              value={codeOnly}
              onChange={(e) => setCodeOnly(e.target.value)}
              placeholder="Email (optional)"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
            >
              {busy ? 'Creating…' : 'Generate code'}
            </button>
          </form>
        </div>
      </div>

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
              <button onClick={() => copyCode(code.id, code.code)} className="text-xs text-primary hover:underline flex-shrink-0">
                {copied === code.id ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={() => remove.mutate(code.id)} className="text-xs text-muted-foreground hover:text-destructive flex-shrink-0">
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
      <h2 className="text-lg font-semibold text-foreground mb-4">Page Background</h2>
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
      <p className="mt-2 text-xs text-muted-foreground">Shown as a banner at the top of all pages except Family Tree. Recommended: landscape, at least 1200×400px.</p>
    </section>
  );
}

interface SmtpFormProps {
  current: SmtpConfigResponse | undefined;
  save: { mutate: (data: SmtpConfig) => void; isPending: boolean };
  test: { mutate: () => void; isPending: boolean };
}

function SmtpForm({ current, save, test }: SmtpFormProps) {
  const [form, setForm] = useState({
    smtp_host: current?.smtp_host ?? '',
    smtp_port: current?.smtp_port ?? 587,
    smtp_user: current?.smtp_user ?? '',
    smtp_password: '',
    from_email: current?.from_email ?? '',
    from_name: current?.from_name ?? 'LandTG Memories',
    admin_email: current?.admin_email ?? '',
    site_url: current?.site_url ?? 'https://mrtag.com',
  });
  const [showHelp, setShowHelp] = useState(false);

  function set(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function applyGmailPreset() {
    setForm((f) => ({ ...f, smtp_host: 'smtp.gmail.com', smtp_port: 587 }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    save.mutate({ ...form, smtp_port: Number(form.smtp_port) });
  }

  const inputCls = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-border">
        <button
          type="button"
          onClick={() => test.mutate()}
          disabled={test.isPending || !current?.configured}
          title={!current?.configured ? 'Save your SMTP settings first' : undefined}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {test.isPending ? 'Sending…' : 'Send a test email'}
        </button>
        <button
          type="button"
          onClick={applyGmailPreset}
          className="rounded-md border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
        >
          Use Gmail (recommended)
        </button>
        <button
          type="button"
          onClick={() => setShowHelp((v) => !v)}
          aria-expanded={showHelp}
          aria-controls="smtp-gmail-help"
          className="text-xs text-primary hover:underline ml-auto"
        >
          {showHelp ? 'Hide help' : 'How to get a Gmail app password →'}
        </button>
      </div>

      {showHelp && (
        <div id="smtp-gmail-help" role="region" aria-label="Gmail setup instructions" className="rounded-md bg-muted/50 border border-border p-4 text-xs text-foreground space-y-2">
          <p className="font-medium">Setting up Gmail SMTP (5 minutes):</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Visit <a href="https://myaccount.google.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">myaccount.google.com</a> → Security.</li>
            <li>Enable <strong>2-Step Verification</strong> if not already on (required for app passwords).</li>
            <li>Open <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-primary hover:underline">App passwords</a>, choose "Mail" / "Other (Custom name)", type "Family Tree", click Generate.</li>
            <li>Copy the 16-character password Google shows (no spaces).</li>
            <li>Paste it into <strong>SMTP Password</strong> below; set <strong>SMTP Username</strong> + <strong>From Email</strong> to your Gmail address.</li>
          </ol>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">SMTP Host</label>
          <input className={inputCls} value={form.smtp_host} onChange={(e) => set('smtp_host', e.target.value)} placeholder="smtp.gmail.com" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Port</label>
          <input className={inputCls} type="number" value={form.smtp_port} onChange={(e) => set('smtp_port', e.target.value)} placeholder="587" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">SMTP Username</label>
          <input className={inputCls} value={form.smtp_user} onChange={(e) => set('smtp_user', e.target.value)} placeholder="you@gmail.com" autoComplete="off" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            SMTP Password {current?.configured && <span className="text-muted-foreground">(leave blank to keep current)</span>}
          </label>
          <input className={inputCls} type="password" value={form.smtp_password} onChange={(e) => set('smtp_password', e.target.value)} placeholder={current?.configured ? '••••••••' : 'App password'} autoComplete="new-password" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">From Email</label>
          <input className={inputCls} value={form.from_email} onChange={(e) => set('from_email', e.target.value)} placeholder="noreply@mrtag.com" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">From Name</label>
          <input className={inputCls} value={form.from_name} onChange={(e) => set('from_name', e.target.value)} placeholder="LandTG Memories" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Admin Notification Email</label>
          <input className={inputCls} value={form.admin_email} onChange={(e) => set('admin_email', e.target.value)} placeholder="admin@example.com" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Site URL</label>
          <input className={inputCls} value={form.site_url} onChange={(e) => set('site_url', e.target.value)} placeholder="https://mrtag.com" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {save.isPending ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  );
}

function SmtpSection() {
  const { data: current, isLoading } = useSmtpConfig();
  const save = useUpdateSmtpConfig();
  const test = useTestSmtpConfig();

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-1">SMTP / Email</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Configure outgoing email for invitations and notifications.
        {current?.configured && <span className="ml-2 text-green-500">● Configured</span>}
        {current && !current.configured && <span className="ml-2 text-yellow-500">● Not configured</span>}
      </p>
      {isLoading ? (
        <div className="h-40 rounded-lg border border-border bg-muted animate-pulse" />
      ) : (
        <SmtpForm
          key={current ? 'loaded' : 'empty'}
          current={current}
          save={save}
          test={test}
        />
      )}
    </section>
  );
}

type ContentTab = 'vignettes' | 'photos' | 'audio' | 'files';

function VignetteRow({ v }: { v: Vignette }) {
  const remove = useDeleteVignette();
  const update = useUpdateVignette();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(v.title);

  async function save() {
    await update.mutateAsync({ id: v.id, data: { title } });
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {editing ? (
        <>
          <input
            className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <button onClick={save} className="text-xs text-primary hover:underline flex-shrink-0">Save</button>
          <button onClick={() => { setEditing(false); setTitle(v.title); }} className="text-xs text-muted-foreground hover:underline flex-shrink-0">Cancel</button>
        </>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{v.title}</p>
            <p className="text-xs text-muted-foreground">{formatDate(v.created_at)}</p>
          </div>
          <button onClick={() => setEditing(true)} className="text-xs text-primary hover:underline flex-shrink-0">Edit</button>
          <button
            onClick={() => { if (confirm('Delete this vignette?')) remove.mutate(v.id); }}
            className="text-xs text-muted-foreground hover:text-destructive flex-shrink-0"
          >Delete</button>
        </>
      )}
    </div>
  );
}

function ContentManagementSection() {
  const [tab, setTab] = useState<ContentTab>('vignettes');
  const { data: vignettes, isLoading: vl } = useVignettes();
  const { data: photos, isLoading: pl } = usePhotos();
  const { data: recordings, isLoading: al } = useAudioList();
  const { data: files, isLoading: fl } = useFiles();
  const deletePhoto = useDeletePhoto();
  const deleteAudio = useDeleteAudio();
  const deleteFile = useDeleteFile();

  const tabs: { id: ContentTab; label: string }[] = [
    { id: 'vignettes', label: 'Vignettes' },
    { id: 'photos', label: 'Photos' },
    { id: 'audio', label: 'Audio' },
    { id: 'files', label: 'Files' },
  ];

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-4">Content Management</h2>
      <div className="flex gap-1 mb-4 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'vignettes' && (
        vl ? <div className="h-20 rounded-lg bg-muted animate-pulse" /> :
        !vignettes?.length ? <p className="text-sm text-muted-foreground">No vignettes.</p> :
        <div className="rounded-lg border border-border divide-y divide-border">
          {vignettes.map((v) => <VignetteRow key={v.id} v={v} />)}
        </div>
      )}

      {tab === 'photos' && (
        pl ? <div className="h-20 rounded-lg bg-muted animate-pulse" /> :
        !photos?.length ? <p className="text-sm text-muted-foreground">No photos.</p> :
        <div className="rounded-lg border border-border divide-y divide-border">
          {photos.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              {(p.thumb_url || p.url) && (
                <img
                  src={p.thumb_url || p.url || ''}
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (p.url && img.src !== p.url) img.src = p.url;
                  }}
                  alt=""
                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.title ?? p.filename}</p>
                <p className="text-xs text-muted-foreground">{formatDate(p.created_at)}</p>
              </div>
              <button
                onClick={() => { if (confirm('Delete this photo?')) deletePhoto.mutate(p.id); }}
                className="text-xs text-muted-foreground hover:text-destructive flex-shrink-0"
              >Delete</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'audio' && (
        al ? <div className="h-20 rounded-lg bg-muted animate-pulse" /> :
        !recordings?.length ? <p className="text-sm text-muted-foreground">No recordings.</p> :
        <div className="rounded-lg border border-border divide-y divide-border">
          {recordings.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{r.title ?? r.filename}</p>
                <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
              </div>
              <button
                onClick={() => { if (confirm('Delete this recording?')) deleteAudio.mutate(r.id); }}
                className="text-xs text-muted-foreground hover:text-destructive flex-shrink-0"
              >Delete</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'files' && (
        fl ? <div className="h-20 rounded-lg bg-muted animate-pulse" /> :
        !files?.length ? <p className="text-sm text-muted-foreground">No files.</p> :
        <div className="rounded-lg border border-border divide-y divide-border">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{f.title ?? f.filename}</p>
                <p className="text-xs text-muted-foreground">{formatDate(f.created_at)}</p>
              </div>
              <button
                onClick={() => { if (confirm('Delete this file?')) deleteFile.mutate(f.id); }}
                className="text-xs text-muted-foreground hover:text-destructive flex-shrink-0"
              >Delete</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function AdminPage() {
  return (
    <div className="space-y-10 max-w-3xl">
      <PageHeader title="Admin" description="Manage users, invitations, content, and settings" />
      <UsersSection />
      <InviteSection />
      <BackgroundSection />
      <SmtpSection />
      <ContentManagementSection />
    </div>
  );
}
