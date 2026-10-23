import { useState } from 'react';
import { useInviteTemplate, useUpdateInviteTemplate, useTestInviteTemplate } from '../hooks/useAdmin';
import type { InviteTemplate } from '@/types/api';

const inputCls = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring';

function InviteTemplateForm({ current }: { current: InviteTemplate }) {
  const save = useUpdateInviteTemplate();
  const test = useTestInviteTemplate();
  const [form, setForm] = useState<InviteTemplate>(current);
  const dirty = form.subject !== current.subject || form.body !== current.body || form.signoff !== current.signoff;

  function set(field: keyof InviteTemplate, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    save.mutate(form);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div className="space-y-1">
        <label htmlFor="invite-subject" className="text-xs font-medium text-muted-foreground">Subject</label>
        <input id="invite-subject" className={inputCls} value={form.subject} onChange={(e) => set('subject', e.target.value)} required />
      </div>
      <div className="space-y-1">
        <label htmlFor="invite-body" className="text-xs font-medium text-muted-foreground">Message</label>
        <textarea id="invite-body" className={`${inputCls} min-h-48`} value={form.body} onChange={(e) => set('body', e.target.value)} required />
      </div>
      <div className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
        The <strong className="text-foreground">Accept Invitation</strong> button, the copy-this-link line, and “This invitation code can only be used once” are added here automatically.
      </div>
      <div className="space-y-1">
        <label htmlFor="invite-signoff" className="text-xs font-medium text-muted-foreground">Sign-off</label>
        <textarea id="invite-signoff" className={`${inputCls} min-h-16`} value={form.signoff} onChange={(e) => set('signoff', e.target.value)} />
      </div>
      <p className="text-xs text-muted-foreground">
        Type <code className="rounded bg-muted px-1 text-foreground">{'{name}'}</code> anywhere to insert the recipient’s name. Leave a blank line between paragraphs.
      </p>
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={save.isPending || !dirty}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {save.isPending ? 'Saving…' : 'Save invitation email'}
        </button>
        <button
          type="button"
          onClick={() => test.mutate()}
          disabled={test.isPending || dirty}
          title={dirty ? 'Save your changes first' : undefined}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
        >
          {test.isPending ? 'Sending…' : 'Send test to me'}
        </button>
        {dirty && (
          <button type="button" onClick={() => setForm(current)} className="text-xs text-muted-foreground hover:text-foreground">
            Discard changes
          </button>
        )}
      </div>
    </form>
  );
}

export function InviteTemplateSection() {
  const { data: current, isLoading } = useInviteTemplate();

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-1">Invitation Email</h2>
      <p className="text-xs text-muted-foreground mb-4">
        The wording people receive when you use “Send email invitation”. Test emails go to the Admin Notification Email.
      </p>
      {isLoading || !current ? (
        <div className="h-40 rounded-lg border border-border bg-muted animate-pulse" />
      ) : (
        <InviteTemplateForm key={`${current.subject}|${current.body}|${current.signoff}`} current={current} />
      )}
    </section>
  );
}
