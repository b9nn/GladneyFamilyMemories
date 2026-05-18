import { useCallback, useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { PhotoGrid } from '@/features/photos/components/PhotoGrid';
import { useWeddingPhotos, useUploadWeddingPhoto, useDeleteWeddingPhoto, useReorderWeddingPhotos } from './hooks/useWedding';
import { useIsAdmin } from '@/lib/utils/useIsAdmin';
import type { Photo } from '@/types/api';

export function WeddingPage() {
  const { data: photos, isLoading } = useWeddingPhotos();
  const uploadPhoto = useUploadWeddingPhoto();
  const deletePhoto = useDeleteWeddingPhoto();
  const reorderPhotos = useReorderWeddingPhotos();
  const isAdmin = useIsAdmin();

  const [showUpload, setShowUpload] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  function handleDelete(id: number) {
    if (!confirm('Delete this photo?')) return;
    deletePhoto.mutate(id);
  }

  function handleReorder(orderedIds: number[]) {
    reorderPhotos.mutate(orderedIds.map((id, i) => ({ photo_id: id, sort_order: i })));
  }

  return (
    <div>
      <PageHeader
        title="Megan & Hongyu Wedding"
        description="Wedding photos"
        action={isAdmin ? (
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {showUpload ? 'Cancel' : 'Upload photos'}
          </button>
        ) : undefined}
      />

      {showUpload && isAdmin && (
        <div className="mb-8 rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Upload wedding photos</h2>
          <WeddingUpload onDone={() => setShowUpload(false)} upload={uploadPhoto} />
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : !photos?.length ? (
        <div className="py-16 text-center text-sm text-muted-foreground">No photos yet.</div>
      ) : isAdmin ? (
        <PhotoGrid
          photos={photos}
          isAdmin={isAdmin}
          onDelete={handleDelete}
          onSelect={(photo) => setLightboxIndex(photos.findIndex(p => p.id === photo.id))}
          onReorderPhotos={handleReorder}
          deleteLabel="Delete"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, idx) => (
            <GuestPhotoCard
              key={photo.id}
              photo={photo}
              onClick={() => setLightboxIndex(idx)}
            />
          ))}
        </div>
      )}

      {lightboxIndex !== null && photos && photos.length > 0 && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

// ── Guest photo card (non-admin, large grid with download) ────────────────────

function GuestPhotoCard({ photo, onClick }: { photo: Photo; onClick: () => void }) {
  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    if (!photo.url) return;
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = photo.filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer" onClick={onClick}>
      <img
        src={photo.thumb_url ?? photo.medium_url ?? photo.url ?? ''}
        alt={photo.title ?? photo.filename}
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      <button
        onClick={handleDownload}
        title="Download"
        className="absolute bottom-1.5 right-1.5 flex items-center justify-center w-7 h-7 rounded-full bg-black/70 text-white text-xs hover:bg-black/90 transition-colors opacity-0 group-hover:opacity-100"
      >
        ↓
      </button>
      {photo.title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-white text-xs truncate">{photo.title}</p>
        </div>
      )}
    </div>
  );
}

// ── Upload panel ──────────────────────────────────────────────────────────────

interface WeddingUploadProps {
  onDone: () => void;
  upload: ReturnType<typeof useUploadWeddingPhoto>;
}

function WeddingUpload({ onDone, upload }: WeddingUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPreviews((prev) => [...prev, ...files.map((f) => ({ file: f, url: URL.createObjectURL(f) }))]);
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
    try {
      await Promise.all(previews.map(({ file }) => upload.mutateAsync({ file })));
      setPreviews([]);
      onDone();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-lg border-2 border-dashed border-border p-8 text-center cursor-pointer hover:border-primary transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.name.toLowerCase().endsWith('.heic'));
          setPreviews(prev => [...prev, ...files.map(f => ({ file: f, url: URL.createObjectURL(f) }))]);
        }}
      >
        <p className="text-muted-foreground text-sm">Click or drag photos here</p>
        <p className="text-xs text-muted-foreground mt-1">Supports JPEG, PNG, HEIC, WebP</p>
        <input ref={fileRef} type="file" accept="image/*,.heic,.heif" multiple className="hidden" onChange={handleFileChange} />
      </div>
      {previews.length > 0 && (
        <>
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
              onClick={() => setPreviews([])}
              className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              Clear
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

interface LightboxProps {
  photos: Photo[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}

function Lightbox({ photos, index, onIndexChange, onClose }: LightboxProps) {
  const photo = photos[index];
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  const prev = useCallback(() => { if (hasPrev) onIndexChange(index - 1); }, [hasPrev, index, onIndexChange]);
  const next = useCallback(() => { if (hasNext) onIndexChange(index + 1); }, [hasNext, index, onIndexChange]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  function handleDownload() {
    if (!photo?.url) return;
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = photo.filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 text-white w-10 h-10 flex items-center justify-center hover:bg-black/90 text-xl z-10"
        >
          ‹
        </button>
      )}
      <div className="relative max-w-5xl max-h-[90vh] px-16 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <img
          src={photo.medium_url ?? photo.url ?? ''}
          onError={(e) => { const img = e.currentTarget; if (photo.url && img.src !== photo.url) img.src = photo.url; }}
          alt={photo.title ?? photo.filename}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />
        {(photo.title || photo.description) && (
          <div className="mt-3 text-center">
            {photo.title && <p className="text-white text-sm font-medium">{photo.title}</p>}
            {photo.description && <p className="text-white/70 text-xs mt-1">{photo.description}</p>}
          </div>
        )}
        {photos.length > 1 && <p className="mt-2 text-white/40 text-xs">{index + 1} / {photos.length}</p>}
      </div>
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 text-white w-10 h-10 flex items-center justify-center hover:bg-black/90 text-xl z-10"
        >
          ›
        </button>
      )}
      <button onClick={onClose} className="absolute top-4 right-4 rounded-full bg-black/60 text-white w-9 h-9 flex items-center justify-center hover:bg-black/90 text-sm z-10">✕</button>
      <button
        onClick={(e) => { e.stopPropagation(); handleDownload(); }}
        title="Download"
        className="absolute top-4 right-16 rounded-full bg-black/60 text-white w-9 h-9 flex items-center justify-center hover:bg-black/90 text-sm z-10"
      >
        ↓
      </button>
    </div>
  );
}
