import { useEffect, useRef, useState } from 'react';
import {
  useAdminUsers, useAnnouncementRecipients, useTestAnnouncement, useSendAnnouncement,
  useAnnouncementDraft, useSaveAnnouncementDraft,
} from '../hooks/useAdmin';
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

/** Wait this long after the last keystroke before saving the wording. */
const AUTOSAVE_DELAY_MS = 800;

function AnnouncementForm({ initial }: { initial: Announcement }) {
  const { data: recipients } = useAnnouncementRecipients();
  const { data: users } = useAdminUsers();
  const test = useTestAnnouncement();
  const send = useSendAnnouncement();
  const saveDraft = useSaveAnnouncementDraft();
  const [form, setForm] = useState<Announcement>(initial);
  const [saveState, setSaveState] = useState<'idle' | 'pending' | 'saved' | 'error'>('idle');
  const lastSaved = useRef<Announcement>(initial);
  const latest = useRef<Announcement>(initial);
  const { mutate: persist } = saveDraft;

  // Autosave: keep the server copy equal to whatever was most recently typed.
  useEffect(() => {
    latest.current = form;
    if (form.subject === lastSaved.current.subject && form.body === lastSaved.current.body) return;
    const t = window.setTimeout(() => {
      persist(form, {
        onSuccess: (saved) => { lastSaved.current = saved; setSaveState('saved'); },
        onError: () => setSaveState('error'),
      });
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [form, persist]);

  // Leaving the page before the autosave fires: save what's there right away.
  useEffect(() => () => {
    const f = latest.current;
    if (f.subject !== lastSaved.current.subject || f.body !== lastSaved.current.body) persist(f);
  }, [persist]);
  const [audience, setAudience] = useState<'all' | 'specific'>('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const skipReason = (u: { is_active: boolean; email?: string | null }): string | null => {
    if (!u.email?.trim()) return u.is_active ? 'no email address' : 'no email address, account inactive';
    if (!u.is_active) return 'account inactive';
    return null;
  };
  const displayName = (u: { full_name: string | null; username: string }) => u.full_name?.trim() || u.username;
  const sortedUsers = [...(users ?? [])].sort((a, b) =>
    displayName(a).localeCompare(displayName(b), undefined, { sensitivity: 'base' }));
  const eligibleUsers = sortedUsers.filter((u) => skipReason(u) === null);
  const skippedUsers = sortedUsers.filter((u) => skipReason(u) !== null);
  const selected = eligibleUsers.filter((u) => selectedIds.includes(u.id));
  const count = audience === 'all' ? recipients?.count ?? 0 : selected.length;
  const ready = form.subject.trim() !== '' && form.body.trim() !== '';

  function set(field: keyof Announcement, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaveState('pending');
  }

  function toggleUser(id: number) {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  function handleSend() {
    const who = `${count} ${count === 1 ? 'person' : 'people'}`;
    if (!confirm(`Send this email to ${who} now? This can't be undone.`)) return;
    send.mutate(audience === 'all' ? form : { ...form, user_ids: selected.map((u) => u.id) });
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-1">Announcement Email</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Email all active users who have an email address, or just the people you pick — for example, to let them know the site has been updated.
        Each person gets their own copy. Test emails go to the Admin Notification Email.
      </p>
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-muted-foreground">Send to</legend>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer select-none">
              <input type="radio" name="announce-audience" checked={audience === 'all'} onChange={() => setAudience('all')} />
              All users
            </label>
            <label className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer select-none">
              <input type="radio" name="announce-audience" checked={audience === 'specific'} onChange={() => setAudience('specific')} />
              Specific users
            </label>
          </div>
          {audience === 'specific' && (
            <div className="max-h-56 overflow-y-auto rounded-md border border-border divide-y divide-border">
              {sortedUsers.map((u) => {
                const reason = skipReason(u);
                return reason === null ? (
                  <label key={u.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer select-none hover:bg-accent">
                    <input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => toggleUser(u.id)} className="rounded" />
                    <span className="text-foreground">{displayName(u)}</span>
                    <span className="min-w-0 truncate text-xs text-muted-foreground">{u.email}</span>
                  </label>
                ) : (
                  <div key={u.id} className="flex items-center gap-2 px-3 py-2 text-sm opacity-50" title="Can't be emailed — fix this in the Users list above">
                    <input type="checkbox" disabled className="rounded" aria-label={`${displayName(u)} can't be emailed`} />
                    <span className="text-foreground">{displayName(u)}</span>
                    <span className="min-w-0 truncate text-xs italic text-muted-foreground">Can't email: {reason}</span>
                  </div>
                );
              })}
            </div>
          )}
          {audience === 'all' && skippedUsers.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {skippedUsers.length} {skippedUsers.length === 1 ? 'user is' : 'users are'} skipped (no email address or inactive account).
              Choose “Specific users” to see who.
            </p>
          )}
        </fieldset>
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
            {send.isPending ? 'Sending…' : audience === 'all' ? `Send to all users (${count})` : `Send to selected users (${count})`}
          </button>
          <button
            type="button"
            onClick={() => test.mutate(form)}
            disabled={test.isPending || !ready}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
          >
            {test.isPending ? 'Sending…' : 'Send test to me'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!confirm('Replace your wording with the original default wording?')) return;
              setForm(DEFAULT_ANNOUNCEMENT);
              const unchanged = DEFAULT_ANNOUNCEMENT.subject === lastSaved.current.subject
                && DEFAULT_ANNOUNCEMENT.body === lastSaved.current.body;
              setSaveState(unchanged ? 'saved' : 'pending');
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Reset to default wording
          </button>
          <span className="ml-auto text-xs text-muted-foreground" aria-live="polite">
            {saveState === 'pending' && 'Saving…'}
            {saveState === 'saved' && 'Wording saved'}
            {saveState === 'error' && <span className="text-destructive">Couldn't save wording — check your connection</span>}
          </span>
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

export function AnnouncementSection() {
  const { data: draft, isLoading } = useAnnouncementDraft();
  if (isLoading) {
    return <div className="h-64 rounded-lg border border-border bg-muted animate-pulse" />;
  }
  // Use the most recently written wording; fall back to the default for anything never saved.
  const initial: Announcement = {
    subject: draft?.subject || DEFAULT_ANNOUNCEMENT.subject,
    body: draft?.body || DEFAULT_ANNOUNCEMENT.body,
  };
  return <AnnouncementForm initial={initial} />;
}
