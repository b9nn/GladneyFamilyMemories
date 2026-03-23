import { useRef, useState } from 'react';
import { useUploadAudio } from '../hooks/useAudio';

interface AudioUploadProps {
  onDone: () => void;
}

export function AudioUpload({ onDone }: AudioUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const upload = useUploadAudio();

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await upload.mutateAsync({ file, title: title || undefined });
      setFile(null);
      setTitle('');
      onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
      )}
      <div className="space-y-1">
        <label htmlFor="audio-title" className="text-sm font-medium text-foreground">Title (optional)</label>
        <input
          id="audio-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Name this audio file…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div
        className="rounded-lg border-2 border-dashed border-border p-8 text-center cursor-pointer hover:border-primary transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <p className="text-muted-foreground text-sm">
          {file ? file.name : 'Click to select an audio file'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">MP3, M4A, WAV, WebM, OGG</p>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      {file && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
