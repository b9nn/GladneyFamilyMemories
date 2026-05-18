import { useCallback, useEffect, useRef, useState } from 'react';
import { PhotoGrid } from '@/features/photos/components/PhotoGrid';
import {
  useWeddingAlbum, useUpsertWeddingAlbum,
  useWeddingPhotos, useUploadWeddingPhoto, useDeleteWeddingPhoto, useReorderWeddingPhotos,
} from './hooks/useWedding';
import { useIsAdmin } from '@/lib/utils/useIsAdmin';
import type { Photo } from '@/types/api';

export function WeddingPage() {
  const { data: album, isLoading: albumLoading, isError: albumError, refetch: refetchAlbum } = useWeddingAlbum();
  const { data: photos, isLoading: photosLoading, isError: photosError, refetch: refetchPhotos } = useWeddingPhotos();
  const upsertAlbum = useUpsertWeddingAlbum();
  const uploadPhoto = useUploadWeddingPhoto();
  const deletePhoto = useDeleteWeddingPhoto();
  const reorderPhotos = useReorderWeddingPhotos();
  const isAdmin = useIsAdmin();

  const [showUpload, setShowUpload] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [albumDesc, setAlbumDesc] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  function openAlbumEditor() {
    setAlbumName(album?.name ?? 'Megan/Hongyu Wedding');
    setAlbumDesc(album?.description ?? '');
    setEditingAlbum(true);
  }

  async function saveAlbum(e: React.FormEvent) {
    e.preventDefault();
    if (!albumName.trim()) return;
    await upsertAlbum.mutateAsync({ name: albumName.trim(), description: albumDesc.trim() || undefined });
    setEditingAlbum(false);
  }

  function handleDelete(id: number) {
    if (!confirm('Delete this photo?')) return;
    deletePhoto.mutate(id);
  }

  function handleReorder(orderedIds: number[]) {
    reorderPhotos.mutate(orderedIds.map((id, i) => ({ photo_id: id, sort_order: i })));
  }

  const isLoading = albumLoading || photosLoading;

  return (
    <div>
      {/* ── Album header ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        {albumLoading ? (
          <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2" />
        ) : editingAlbum ? (
          <form onSubmit={saveAlbum} className="rounded-lg border border-border bg-card p-4 space-y-3 max-w-lg">
            <p className="text-sm font-semibold text-foreground">Album settings</p>
            <input
              type="text"
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
              placeholder="Album name"
              autoFocus
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <textarea
              value={albumDesc}
              onChange={(e) => setAlbumDesc(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!albumName.trim() || upsertAlbum.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {upsertAlbum.isPending ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setEditingAlbum(false)}
                className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : album ? (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{album.name}</h1>
              {album.description && (
                <p className="mt-1 text-sm text-muted-foreground">{album.description}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {album.photo_count} {album.photo_count === 1 ? 'photo' : 'photos'}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {isAdmin && (
                <>
                  <button
                    onClick={openAlbumEditor}
                    className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    Edit album
                  </button>
                  <button
                    onClick={() => setShowUpload((v) => !v)}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                  >
                    {showUpload ? 'Cancel' : 'Upload photos'}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : albumError ? (
          /* No album yet — admin sees setup button, guests see nothing */
          isAdmin ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Wedding Photos</h1>
                <p className="mt-1 text-sm text-muted-foreground">No album set up yet.</p>
              </div>
              <button
                onClick={openAlbumEditor}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 flex-shrink-0"
              >
                Set up album
              </button>
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-foreground">Wedding Photos</h1>
          )
        ) : null}
      </div>

      {/* ── Upload panel ─────────────────────────────────────────────────── */}
      {showUpload && isAdmin && (
        <div className="mb-8 rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Upload wedding photos</h2>
          <WeddingUpload onDone={() => setShowUpload(false)} upload={uploadPhoto} />
        </div>
      )}

      {/* ── Photos ───────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : photosError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-muted-foreground">Could not load photos.</p>
          <button
            onClick={() => { refetchAlbum(); refetchPhotos(); }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      ) : !photos?.length ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          {isAdmin ? 'No photos yet. Use "Upload photos" to add some.' : 'No photos yet.'}
        </div>
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

// ── Guest photo card ──────────────────────────────────────────────────────────

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
