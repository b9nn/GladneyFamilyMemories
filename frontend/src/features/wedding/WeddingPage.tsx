import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { PhotoGrid } from '@/features/photos/components/PhotoGrid';
import { PhotoUpload } from '@/features/photos/components/PhotoUpload';
import { AlbumGrid } from '@/features/photos/components/AlbumGrid';
import { AlbumView } from '@/features/photos/components/AlbumView';
import {
  useWeddingPhotos, useUploadWeddingPhoto, useUpdateWeddingPhoto, useDeleteWeddingPhoto,
  useWeddingAlbums, useCreateWeddingAlbum, useUpdateWeddingAlbum, useDeleteWeddingAlbum,
  useAddPhotoToWeddingAlbum, useReorderWeddingAlbums, useWeddingAlbumPhotos,
  useSetWeddingAlbumCover, useReorderWeddingAlbumPhotos,
} from './hooks/useWedding';
import { useIsAdmin } from '@/lib/utils/useIsAdmin';
import type { Album, Photo } from '@/types/api';

export function WeddingPage() {
  const { data: photos, isLoading: loadingPhotos, isError: photosError, refetch: refetchPhotos } = useWeddingPhotos();
  const { data: albums, isLoading: loadingAlbums } = useWeddingAlbums();
  const deletePhoto = useDeleteWeddingPhoto();
  const updatePhoto = useUpdateWeddingPhoto();
  const uploadPhoto = useUploadWeddingPhoto();
  const createAlbum = useCreateWeddingAlbum();
  const deleteAlbum = useDeleteWeddingAlbum();
  const addPhotoToAlbum = useAddPhotoToWeddingAlbum();
  const reorderAlbums = useReorderWeddingAlbums();
  const updateAlbum = useUpdateWeddingAlbum();
  const isAdmin = useIsAdmin();

  const [showUpload, setShowUpload] = useState(false);
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [lightboxPhotos, setLightboxPhotos] = useState<Photo[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
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

  // Album detail view
  if (selectedAlbum) {
    return (
      <>
        <WeddingAlbumView
          album={selectedAlbum}
          allPhotos={photos ?? []}
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
        title="Megan/Nemo Wedding"
        description="Wedding photos and albums"
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
          <PhotoUpload upload={uploadPhoto} onDone={() => setShowUpload(false)} />
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
        </div>
      ) : (
        <div className="space-y-10">
          {/* Albums */}
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

          {/* All photos */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-4">All Photos</h2>
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
                description="Upload your first wedding photo to get started."
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
                photos={photos}
                isAdmin={isAdmin}
                albums={albums ?? []}
                onDelete={handleDeletePhoto}
                onSelect={(photo) => openLightbox(photos, photo)}
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

      {/* Album drop zone while dragging */}
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

// ── Wedding album view — wraps AlbumView with wedding-specific hooks ───────────

interface WeddingAlbumViewProps {
  album: Album;
  allPhotos: Photo[];
  onBack: () => void;
  onLightbox: (photos: Photo[], photo: Photo) => void;
}

function WeddingAlbumView({ album, allPhotos, onBack, onLightbox }: WeddingAlbumViewProps) {
  const removePhoto = useRemovePhotoFromWeddingAlbum();
  const addPhoto = useAddPhotoToWeddingAlbum();
  const setCover = useSetWeddingAlbumCover();
  const reorderPhotos = useReorderWeddingAlbumPhotos(album.id);
  const isAdmin = useIsAdmin();
  const { data: albumPhotos, isLoading } = useWeddingAlbumPhotos(album.id);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const albumPhotoIds = new Set(albumPhotos?.map((p) => p.id) ?? []);
  const availableToAdd = allPhotos.filter((p) => !albumPhotoIds.has(p.id));

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          ← Wedding
        </button>
        <span className="text-muted-foreground">/</span>
        <h2 className="text-lg font-semibold text-foreground">{album.name}</h2>
        <span className="text-sm text-muted-foreground ml-1">
          ({album.photo_count} {album.photo_count === 1 ? 'photo' : 'photos'})
        </span>
        {isAdmin && (
          <div className="ml-auto">
            <button
              onClick={() => setShowAddPanel((v) => !v)}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              {showAddPanel ? 'Done adding' : 'Add photos'}
            </button>
          </div>
        )}
      </div>

      {showAddPanel && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground mb-3">Click a photo to add it to this album</p>
          {!availableToAdd.length ? (
            <p className="text-sm text-muted-foreground">All photos are already in this album.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
              {availableToAdd.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => addPhoto.mutate({ albumId: album.id, photoId: photo.id })}
                  className="aspect-square rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                >
                  {(photo.thumb_url || photo.url) ? (
                    <img
                      src={photo.thumb_url || photo.url || ''}
                      onError={(e) => { const img = e.currentTarget; if (photo.url && img.src !== photo.url) img.src = photo.url; }}
                      alt={photo.title ?? photo.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">?</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : !albumPhotos?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-semibold text-foreground">No photos in this album</p>
          <p className="text-sm text-muted-foreground mt-1">Click "Add photos" to add some.</p>
        </div>
      ) : (
        <PhotoGrid
          photos={albumPhotos}
          isAdmin={isAdmin}
          onDelete={(photoId) => removePhoto.mutate({ albumId: album.id, photoId })}
          onSelect={(photo) => onLightbox(albumPhotos, photo)}
          onSetCover={isAdmin ? (photo) => setCover.mutate({ albumId: album.id, photoId: photo.id }) : undefined}
          deleteLabel="Remove"
          onReorderPhotos={isAdmin ? (orderedIds) => reorderPhotos.mutate(orderedIds.map((id, i) => ({ photo_id: id, sort_order: i }))) : undefined}
        />
      )}
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

import { useCallback, useEffect } from 'react';

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
        <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 text-white w-10 h-10 flex items-center justify-center hover:bg-black/90 text-xl z-10">‹</button>
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
        <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 text-white w-10 h-10 flex items-center justify-center hover:bg-black/90 text-xl z-10">›</button>
      )}
      <button onClick={onClose} className="absolute top-4 right-4 rounded-full bg-black/60 text-white w-9 h-9 flex items-center justify-center hover:bg-black/90 text-sm z-10">✕</button>
      <button onClick={(e) => { e.stopPropagation(); handleDownload(); }} title="Download" className="absolute top-4 right-16 rounded-full bg-black/60 text-white w-9 h-9 flex items-center justify-center hover:bg-black/90 text-sm z-10">↓</button>
    </div>
  );
}
