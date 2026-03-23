import { useState } from 'react';
import type { FamilyMember } from '@/types/api';

interface MemberFormProps {
  initial?: FamilyMember;
  onSave: (data: {
    first_name: string;
    last_name: string;
    birth_date: string;
    death_date: string;
    bio: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export function MemberForm({ initial, onSave, onCancel }: MemberFormProps) {
  const [form, setForm] = useState({
    first_name: initial?.first_name ?? '',
    last_name: initial?.last_name ?? '',
    birth_date: initial?.birth_date ?? '',
    death_date: initial?.death_date ?? '',
    bio: initial?.bio ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name.trim()) { setError('First name is required'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(form);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="first_name" className="text-sm font-medium text-foreground">First name *</label>
          <input id="first_name" name="first_name" type="text" required value={form.first_name} onChange={handleChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1">
          <label htmlFor="last_name" className="text-sm font-medium text-foreground">Last name</label>
          <input id="last_name" name="last_name" type="text" value={form.last_name} onChange={handleChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1">
          <label htmlFor="birth_date" className="text-sm font-medium text-foreground">Birth date</label>
          <input id="birth_date" name="birth_date" type="date" value={form.birth_date} onChange={handleChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1">
          <label htmlFor="death_date" className="text-sm font-medium text-foreground">Death date</label>
          <input id="death_date" name="death_date" type="date" value={form.death_date} onChange={handleChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="bio" className="text-sm font-medium text-foreground">Bio</label>
        <textarea id="bio" name="bio" rows={3} value={form.bio} onChange={handleChange}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50">
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add member'}
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent">
          Cancel
        </button>
      </div>
    </form>
  );
}
