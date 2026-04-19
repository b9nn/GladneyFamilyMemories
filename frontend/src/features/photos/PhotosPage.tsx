import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { PhotoGrid } from './components/PhotoGrid';
import { PhotoUpload } from './components/PhotoUpload';
import { AlbumGrid } from './components/AlbumGrid';
import { AlbumView } from './components/AlbumView';
import { usePhotos, useDeletePhoto, useUpdatePhoto } from './hooks/usePhotos';
import { useAlbums, useCreateAlbum, useDeleteAlbum, useUpdateAlbum, useAddPhotoToAlbum, useReorderAlbums } from './hooks/useAlbums';
import { useIsAdmin } from '@/lib/utils/useIsAdmin';
import type { Album, Photo } from '@/types/api';

export function PhotosPage() {
  const { data: photos, isLoading: loadingPhotos, isError: photosError, refetch: refetchPhotos } = usePhotos();
  const { data: albums, isLoading: loadingAlbums } = useAlbums();
  const deletePhoto = useDeletePhoto();
  const updatePhoto = useUpdatePhoto();
  const createAlbum = useCreateAlbum();
  const deleteAlbum = useDeleteAlbum();
  const addPhotoToAlbum = useAddPhotoToAlbum();
  const reorderAlbums = useReorderAlbums();
  const updateAlbum = useUpdateAlbum();
  const isAdmin = useIsAdmin();

  const [showUpload, setShowUpload] = useState(false);
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [lightboxPhotos, setLightboxPhotos] = useState<Photo[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [sortKey, setSortKey] = useState<'created_at' | 'taken_at'>('created_at');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [draggingPhotoId, setDraggingPhotoId] = useState<number | null>(null);
  const [dropOverAlbumId, setDropOverAlbumId] = useState<number | null>(null);

  function handleDeletePhoto(id: number) {
    if (!confirm('Delete this photo?')) return;
    deletePhoto.mutate(id);
  }

  function handleDeleteAlbum(id: number) {
    if (!confirm('Delete this album? Photos will not be deleted.')) return;
    deleteAlbum.mutate(id);
  }

  async function handleCreateAlbum(e: React.FormEvent) {
    e.preventDefault();
    if (!newAlbumName.trim()) return;
    await createAlbum.mutateAsync({ name: newAlbumName.trim() });
    setNewAlbumName('');
    setShowNewAlbum(false);
  }

  function openLightbox(photoList: Photo[], photo: Photo) {
    const idx = photoList.findIndex(p => p.id === photo.id);
    setLightboxPhotos(photoList);
    setLightboxIndex(idx >= 0 ? idx : 0);
  }

  function closeLightbox() {
    setLightboxPhotos([]);
    setLightboxIndex(0);
  }

  const sortedPhotos = photos ? [...photos].sort((a, b) => {
    const aVal = sortKey === 'taken_at' ? (a.taken_at ?? a.created_at) : a.created_at;
    const bVal = sortKey === 'taken_at' ? (b.taken_at ?? b.created_at) : b.created_at;
    const diff = new Date(aVal).getTime() - new Date(bVal).getTime();
    return sortDir === 'desc' ? -diff : diff;
  }) : [];

  // Album detail view
  if (selectedAlbum) {
    return (
      <>
        <AlbumView
          album={selectedAlbum}
          onBack={() => setSelectedAlbum(null)}
          onLightbox={(photoList, photo) => openLightbox(photoList, photo)}
        />
        {lightboxPhotos.length > 0 && (
          <Lightbox
            photos={lightboxPhotos}
            index={lightboxIndex}
            onIndexChange={setLightboxIndex}
            onClose={closeLightbox}
          />
        )}
      </>
    );
  }

  const isLoading = loadingPhotos || loadingAlbums;

  return (
    <div>
      <PageHeader
        title="Photos"
        description="Family photos and albums"
        action={isAdmin ? (
          <div className="flex gap-2">
            <button
              onClick={() => { setShowNewAlbum((v) => !v); setShowUpload(false); }}
              className="rounded-md border border-white/60 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              {showNewAlbum ? 'Cancel' : 'New album'}
            </button>
            <button
              onClick={() => { setShowUpload((v) => !v); setShowNewAlbum(false); }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              {showUpload ? 'Cancel' : 'Upload photos'}
            </button>
          </div>
        ) : undefined}
      />

      {/* New album form */}
      {showNewAlbum && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <form onSubmit={handleCreateAlbum} className="flex gap-3">
            <input
              type="text"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              placeholder="Album name…"
              autoFocus
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={!newAlbumName.trim() || createAlbum.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {createAlbum.isPending ? 'Creating…' : 'Create'}
            </button>
          </form>
        </div>
      )}

      {/* Upload panel */}
      {showUpload && (
        <div className="mb-8 rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Upload photos</h2>
          <PhotoUpload onDone={() => setShowUpload(false)} />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-8">
          <div>
            <div className="h-5 w-24 bg-muted rounded animate-pulse mb-4" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          </div>
          <div>
            <div className="h-5 w-24 bg-muted rounded animate-pulse mb-4" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {/* ── Albums ── */}
          {(albums?.length ?? 0) > 0 && (
            <section>
              <h2 className="text-base font-semibold text-foreground mb-4">Albums</h2>
              <AlbumGrid
                albums={albums!}
                isAdmin={isAdmin}
                onSelect={setSelectedAlbum}
                onDelete={handleDeleteAlbum}
                onRename={(id, name) => updateAlbum.mutate({ id, data: { name } })}
                onDropPhoto={(albumId, photoId) => addPhotoToAlbum.mutate({ albumId, photoId })}
                onReorder={(orderedIds) => reorderAlbums.mutate(orderedIds.map((id, i) => ({ id, sort_order: i })))}
              />
            </section>
          )}

          {/* ── All photos ── */}
          <section>
            <div className="flex items-center justify-between mb-4 gap-3">
              <h2 className="text-base font-semibold text-foreground">All Photos</h2>
              {isAdmin && (photos?.length ?? 0) > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as 'created_at' | 'taken_at')}
                    className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="created_at">Upload date</option>
                    <option value="taken_at">Taken date</option>
                  </select>
                  <button
                    onClick={() => setSortDir((d) => d === 'desc' ? 'asc' : 'desc')}
                    className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground hover:bg-accent"
                  >
                    {sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
                  </button>
                </div>
              )}
            </div>
            {photosError ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <p className="text-sm text-muted-foreground">Could not load photos.</p>
                <button
                  onClick={() => refetchPhotos()}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Retry
                </button>
              </div>
            ) : !photos?.length ? (
              <EmptyState
                title="No photos yet"
                description="Upload your first family photo to get started."
                action={isAdmin ? (
                  <button
                    onClick={() => setShowUpload(true)}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                  >
                    Upload photos
                  </button>
                ) : undefined}
              />
            ) : (
              <PhotoGrid
                photos={sortedPhotos}
                isAdmin={isAdmin}
                albums={albums ?? []}
                onDelete={handleDeletePhoto}
                onSelect={(photo) => openLightbox(sortedPhotos, photo)}
                onUpdate={(id, data) => updatePhoto.mutate({ id, data })}
                onAddToAlbum={(photoId, albumId) => addPhotoToAlbum.mutate({ albumId, photoId })}
                onPhotoDragStart={setDraggingPhotoId}
                onPhotoDragEnd={() => { setDraggingPhotoId(null); setDropOverAlbumId(null); }}
                showDetails={isAdmin}
                draggable={(albums?.length ?? 0) > 0}
              />
            )}
          </section>
        </div>
      )}

      {/* Floating album drop zone — appears while dragging a photo */}
      {draggingPhotoId !== null && (albums?.length ?? 0) > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border border-border bg-card/95 backdrop-blur px-4 py-3 shadow-2xl">
          <span className="text-xs font-medium text-muted-foreground flex-shrink-0">Drop into album:</span>
          {albums!.map((album) => (
            <div
              key={album.id}
              onDragOver={(e) => { e.preventDefault(); setDropOverAlbumId(album.id); }}
              onDragLeave={() => setDropOverAlbumId(null)}
              onDrop={(e) => {
                e.preventDefault();
                const photoId = Number(e.dataTransfer.getData('photoId'));
                if (photoId) addPhotoToAlbum.mutate({ albumId: album.id, photoId });
                setDraggingPhotoId(null);
                setDropOverAlbumId(null);
              }}
              className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                dropOverAlbumId === album.id
                  ? 'border-primary bg-primary text-primary-foreground scale-105'
                  : 'border-border text-foreground hover:border-primary/60'
              }`}
            >
              {album.name}
            </div>
          ))}
        </div>
      )}

      {lightboxPhotos.length > 0 && (
        <Lightbox
          photos={lightboxPhotos}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
}

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

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      {/* Prev */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 text-white w-10 h-10 flex items-center justify-center hover:bg-black/90 text-xl z-10"
        >
          ‹
        </button>
      )}
      {/* Image */}
      <div className="relative max-w-5xl max-h-[90vh] px-16 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <img
          src={photo.url ?? ''}
          alt={photo.title ?? photo.filename}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />
        {(photo.title || photo.description) && (
          <div className="mt-3 text-center">
            {photo.title && <p className="text-white text-sm font-medium">{photo.title}</p>}
            {photo.description && <p className="text-white/70 text-xs mt-1">{photo.description}</p>}
          </div>
        )}
        {photos.length > 1 && (
          <p className="mt-2 text-white/40 text-xs">{index + 1} / {photos.length}</p>
        )}
      </div>
      {/* Next */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 text-white w-10 h-10 flex items-center justify-center hover:bg-black/90 text-xl z-10"
        >
          ›
        </button>
      )}
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-black/60 text-white w-9 h-9 flex items-center justify-center hover:bg-black/90 text-sm z-10"
      >
        ✕
      </button>
    </div>
  );
}
