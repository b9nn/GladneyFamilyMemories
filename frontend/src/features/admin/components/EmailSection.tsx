import { useState } from 'react';
import { useEmailConfig, useUpdateEmailConfig, useTestEmailConfig } from '../hooks/useAdmin';
import type { EmailConfig, EmailConfigResponse } from '@/types/api';

const inputCls = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring';

interface EmailFormProps {
  current: EmailConfigResponse | undefined;
  save: { mutate: (data: EmailConfig) => void; isPending: boolean };
  test: { mutate: () => void; isPending: boolean };
}

function EmailForm({ current, save, test }: EmailFormProps) {
  const [form, setForm] = useState<EmailConfig>({
    from_name: current?.from_name ?? 'Gladney Family Tree',
    admin_email: current?.admin_email ?? '',
    site_url: current?.site_url ?? 'https://mrtag.com',
  });

  function set(field: keyof EmailConfig, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    save.mutate(form);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-border">
        <button
          type="button"
          onClick={() => test.mutate()}
          disabled={test.isPending || !current?.configured}
          title={!current?.configured ? 'Resend is not connected on the server' : undefined}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {test.isPending ? 'Sending…' : 'Send a test email'}
        </button>
        <span className="text-xs text-muted-foreground">
          Sends to the Admin Notification Email (or your own email if that's blank).
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">From Email</label>
          <input className={`${inputCls} opacity-70`} value={current?.from_email ?? ''} readOnly aria-readonly="true" />
        </div>
        <div className="space-y-1">
          <label htmlFor="email-from-name" className="text-xs font-medium text-muted-foreground">From Name</label>
          <input id="email-from-name" className={inputCls} value={form.from_name} onChange={(e) => set('from_name', e.target.value)} placeholder="Gladney Family Tree" />
        </div>
        <div className="space-y-1">
          <label htmlFor="email-admin" className="text-xs font-medium text-muted-foreground">Admin Notification Email</label>
          <input id="email-admin" className={inputCls} type="email" value={form.admin_email} onChange={(e) => set('admin_email', e.target.value)} placeholder="admin@example.com" />
        </div>
        <div className="space-y-1">
          <label htmlFor="email-site-url" className="text-xs font-medium text-muted-foreground">Site URL</label>
          <input id="email-site-url" className={inputCls} value={form.site_url} onChange={(e) => set('site_url', e.target.value)} placeholder="https://mrtag.com" />
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

export function EmailSection() {
  const { data: current, isLoading } = useEmailConfig();
  const save = useUpdateEmailConfig();
  const test = useTestEmailConfig();

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-1">Email (Resend)</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Invitations, password resets, and announcements are sent through Resend.
        {current?.configured && <span className="ml-2 text-green-500">● Connected</span>}
        {current && !current.configured && <span className="ml-2 text-yellow-500">● Not connected — the server's RESEND_KEY is missing</span>}
      </p>
      {isLoading ? (
        <div className="h-40 rounded-lg border border-border bg-muted animate-pulse" />
      ) : (
        <EmailForm key={current ? 'loaded' : 'empty'} current={current} save={save} test={test} />
      )}
    </section>
  );
}
