import { useState } from 'react';
import { VignetteEditor } from './VignetteEditor';
import type { Vignette } from '@/types/api';

interface VignetteFormProps {
  initial?: Vignette;
  onSave: (title: string, content: string) => Promise<void>;
  onCancel: () => void;
}

export function VignetteForm({ initial, onSave, onCancel }: VignetteFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(title.trim(), content);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="space-y-1">
        <label htmlFor="vignette-title" className="text-sm font-medium text-foreground">Title</label>
        <input
          id="vignette-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give this memory a title…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Content</label>
        <VignetteEditor
          content={content}
          onChange={setContent}
          placeholder="Write your memory here…"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create vignette'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
