import { useState } from 'react';
import { useDashboardIntro, useUpdateDashboardIntro } from '../hooks/useDashboard';
import { useIsAdmin } from '@/lib/utils/useIsAdmin';

export function DashboardIntroSection() {
  const isAdmin = useIsAdmin();
  const { data } = useDashboardIntro();
  const update = useUpdateDashboardIntro();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const text = data?.text ?? '';
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  function startEdit() {
    setDraft(text);
    setEditing(true);
  }

  function save() {
    update.mutate({ text: draft }, { onSuccess: () => setEditing(false) });
  }

  if (editing) {
    return (
      <div className="mb-8 rounded-lg border border-border bg-card p-4 space-y-3">
        <label htmlFor="dashboard-intro" className="text-xs font-medium text-muted-foreground">
          Introduction — everyone sees this on the dashboard. Leave a blank line between paragraphs.
        </label>
        <textarea
          id="dashboard-intro"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={5000}
          autoFocus
          className="w-full min-h-40 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={update.isPending}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {update.isPending ? 'Saving…' : 'Save'}
          </button>
          <button onClick={() => setEditing(false)} className="rounded-md border border-input px-3 py-1.5 text-xs text-foreground hover:bg-accent">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (!paragraphs.length) {
    return isAdmin ? (
      <button
        onClick={startEdit}
        className="mb-8 w-full rounded-lg border border-dashed border-border bg-card/60 px-4 py-3 text-left text-sm text-muted-foreground hover:text-foreground"
      >
        + Add an introduction to the website
      </button>
    ) : null;
  }

  return (
    <div className="mb-8 rounded-lg border border-border bg-card p-4">
      <div className="space-y-3 max-w-3xl">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-lg sm:text-xl leading-snug text-yellow-400 whitespace-pre-line">{p}</p>
        ))}
      </div>
      {isAdmin && (
        <button onClick={startEdit} className="mt-3 text-xs text-muted-foreground hover:text-foreground">
          Edit introduction
        </button>
      )}
    </div>
  );
}
