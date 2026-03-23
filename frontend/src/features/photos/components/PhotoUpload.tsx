import { useRef, useState } from 'react';
import { useUploadPhoto } from '../hooks/usePhotos';

interface PhotoUploadProps {
  onDone: () => void;
}

export function PhotoUpload({ onDone }: PhotoUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const upload = useUploadPhoto();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newPreviews = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setPreviews((prev) => [...prev, ...newPreviews]);
  }

  function removePreview(idx: number) {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function handleUpload() {
    if (!previews.length) return;
    setUploading(true);
    setError('');
    try {
      await Promise.all(previews.map(({ file }) => upload.mutateAsync({ file, title: title || undefined })));
      setPreviews([]);
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
        <label htmlFor="photo-title" className="text-sm font-medium text-foreground">Title (optional)</label>
        <input
          id="photo-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Album or photo title"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div
        className="rounded-lg border-2 border-dashed border-border p-8 text-center cursor-pointer hover:border-primary transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.name.toLowerCase().endsWith('.heic'));
          const newPreviews = files.map(f => ({ file: f, url: URL.createObjectURL(f) }));
          setPreviews(prev => [...prev, ...newPreviews]);
        }}
      >
        <p className="text-muted-foreground text-sm">Click or drag photos here</p>
        <p className="text-xs text-muted-foreground mt-1">Supports JPEG, PNG, HEIC, WebP</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {previews.map(({ url }, i) => (
            <div key={i} className="relative group aspect-square">
              <img src={url} alt="" className="w-full h-full object-cover rounded" />
              <button
                type="button"
                onClick={() => removePreview(i)}
                className="absolute top-1 right-1 rounded-full bg-black/60 text-white text-xs w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      {previews.length > 0 && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {uploading ? `Uploading ${previews.length} photo${previews.length > 1 ? 's' : ''}…` : `Upload ${previews.length} photo${previews.length > 1 ? 's' : ''}`}
          </button>
          <button
            type="button"
            onClick={() => { setPreviews([]); setTitle(''); }}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
