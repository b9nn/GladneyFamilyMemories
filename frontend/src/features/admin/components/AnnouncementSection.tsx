import { useState } from 'react';
import { useAnnouncementRecipients, useTestAnnouncement, useSendAnnouncement } from '../hooks/useAdmin';
import type { Announcement } from '@/types/api';

const inputCls = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring';

const DEFAULT_ANNOUNCEMENT: Announcement = {
  subject: "Lorna and Tom's Memories has been updated",
  body: (
    "Hi {name},\n\n"
    + "We've just added new things to Lorna and Tom's Memories website. Come take a look!\n\n"
    + "Lorna and Tom"
  ),
};

export function AnnouncementSection() {
  const { data: recipients } = useAnnouncementRecipients();
  const test = useTestAnnouncement();
  const send = useSendAnnouncement();
  const [form, setForm] = useState<Announcement>(DEFAULT_ANNOUNCEMENT);
  const count = recipients?.count ?? 0;
  const ready = form.subject.trim() !== '' && form.body.trim() !== '';

  function set(field: keyof Announcement, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSend() {
    const who = `${count} ${count === 1 ? 'person' : 'people'}`;
    if (confirm(`Send this email to ${who} now? This can't be undone.`)) send.mutate(form);
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-1">Announcement Email</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Email every active user who has an email address — for example, to let them know the site has been updated.
        Each person gets their own copy. Test emails go to the Admin Notification Email.
      </p>
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="space-y-1">
          <label htmlFor="announce-subject" className="text-xs font-medium text-muted-foreground">Subject</label>
          <input id="announce-subject" className={inputCls} value={form.subject} onChange={(e) => set('subject', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label htmlFor="announce-body" className="text-xs font-medium text-muted-foreground">Message</label>
          <textarea id="announce-body" className={`${inputCls} min-h-48`} value={form.body} onChange={(e) => set('body', e.target.value)} />
        </div>
        <div className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          A <strong className="text-foreground">Visit mrtag.com</strong> button and link are added below your message automatically.
        </div>
        <p className="text-xs text-muted-foreground">
          Type <code className="rounded bg-muted px-1 text-foreground">{'{name}'}</code> anywhere to insert the recipient’s name. Leave a blank line between paragraphs.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSend}
            disabled={send.isPending || !ready || count === 0}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {send.isPending ? 'Sending…' : `Send to all users (${count})`}
          </button>
          <button
            type="button"
            onClick={() => test.mutate(form)}
            disabled={test.isPending || !ready}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
          >
            {test.isPending ? 'Sending…' : 'Send test to me'}
          </button>
          <button type="button" onClick={() => setForm(DEFAULT_ANNOUNCEMENT)} className="text-xs text-muted-foreground hover:text-foreground">
            Reset wording
          </button>
        </div>
        {send.data && (
          <div className="rounded-md bg-muted px-3 py-2 text-xs text-foreground space-y-1">
            <p>Sent to {send.data.sent} {send.data.sent === 1 ? 'person' : 'people'}.</p>
            {send.data.failed.length > 0 && (
              <>
                <p className="text-destructive">Could not send to:</p>
                <ul className="list-disc pl-5">
                  {send.data.failed.map((f) => <li key={f.email}>{f.email} — {f.error}</li>)}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
