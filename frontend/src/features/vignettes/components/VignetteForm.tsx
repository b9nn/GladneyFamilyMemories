import { useRef, useState } from 'react';
import { VignetteEditor } from './VignetteEditor';
import { useAttachVignettePhoto, useDetachVignettePhoto } from '../hooks/useVignettes';
import type { Vignette, VignettePhoto } from '@/types/api';

interface VignetteFormProps {
  initial?: Vignette;
  onSave: (title: string, content: string) => Promise<Vignette>;
  onCancel: () => void;
}

export function VignetteForm({ initial, onSave, onCancel }: VignetteFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // For a new vignette we queue files locally until after creation
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  // vignetteId is known once created/editing
  const [vignetteId, setVignetteId] = useState<number | null>(initial?.id ?? null);
  const [photos, setPhotos] = useState<VignettePhoto[]>(initial?.photos ?? []);

  const fileRef = useRef<HTMLInputElement>(null);
  const attach = useAttachVignettePhoto(vignetteId ?? 0);
  const detach = useDetachVignettePhoto(vignetteId ?? 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      const saved = await onSave(title.trim(), content);
      const id = saved.id;
      setVignetteId(id);
      // Upload any queued photos now that we have an ID
      for (const file of pendingFiles) {
        const vp = await attach.mutateAsync(file, { onSuccess: undefined });
        setPhotos((prev) => [...prev, vp]);
      }
      setPendingFiles([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (vignetteId) {
      // Already saved — attach immediately
      try {
        const vp = await attach.mutateAsync(file);
        setPhotos((prev) => [...prev, vp]);
      } catch {
        setError('Failed to upload photo');
      }
    } else {
      // Not saved yet — queue it
      setPendingFiles((prev) => [...prev, file]);
    }
  }

  async function handleDetach(vpId: number) {
    if (!vignetteId) {
      setPhotos((prev) => prev.filter((p) => p.id !== vpId));
      return;
    }
    try {
      await detach.mutateAsync(vpId);
      setPhotos((prev) => prev.filter((p) => p.id !== vpId));
    } catch {
      setError('Failed to remove photo');
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
        <VignetteEditor content={content} onChange={setContent} placeholder="Write your memory here…" />
      </div>

      {/* Photos */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Photos</label>
        {(photos.length > 0 || pendingFiles.length > 0) && (
          <div className="flex flex-wrap gap-3">
            {photos.map((vp) => (
              <div key={vp.id} className="relative group w-24 h-24">
                {vp.url && (
                  <img src={vp.url} alt="" className="w-full h-full object-cover rounded-md border border-border" />
                )}
                <button
                  type="button"
                  onClick={() => handleDetach(vp.id)}
                  className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-5 h-5 rounded-full bg-black/70 text-white text-xs hover:bg-red-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
            {pendingFiles.map((f, i) => (
              <div key={i} className="relative group w-24 h-24 rounded-md border border-border bg-muted flex items-center justify-center overflow-hidden">
                <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-5 h-5 rounded-full bg-black/70 text-white text-xs hover:bg-red-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-input px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          + Add photo
        </button>
        <input ref={fileRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleFileChange} />
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
