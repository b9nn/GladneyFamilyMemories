import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { PhotoGrid } from './components/PhotoGrid';
import { PhotoUpload } from './components/PhotoUpload';
import { AlbumGrid } from './components/AlbumGrid';
import { AlbumView } from './components/AlbumView';
import { usePhotos, useDeletePhoto } from './hooks/usePhotos';
import { useAlbums, useCreateAlbum, useDeleteAlbum } from './hooks/useAlbums';
import type { Album, Photo } from '@/types/api';

export function PhotosPage() {
  const { data: photos, isLoading: loadingPhotos } = usePhotos();
  const { data: albums, isLoading: loadingAlbums } = useAlbums();
  const deletePhoto = useDeletePhoto();
  const createAlbum = useCreateAlbum();
  const deleteAlbum = useDeleteAlbum();

  const [showUpload, setShowUpload] = useState(false);
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [lightbox, setLightbox] = useState<Photo | null>(null);

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

  // Album detail view
  if (selectedAlbum) {
    return (
      <>
        <AlbumView
          album={selectedAlbum}
          onBack={() => setSelectedAlbum(null)}
          onLightbox={setLightbox}
        />
        {lightbox && <Lightbox photo={lightbox} onClose={() => setLightbox(null)} />}
      </>
    );
  }

  const isLoading = loadingPhotos || loadingAlbums;

  return (
    <div>
      <PageHeader
        title="Photos"
        description="Family photos and albums"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => { setShowNewAlbum((v) => !v); setShowUpload(false); }}
              className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
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
        }
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
                onSelect={setSelectedAlbum}
                onDelete={handleDeleteAlbum}
              />
            </section>
          )}

          {/* ── All photos ── */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-4">All Photos</h2>
            {!photos?.length ? (
              <EmptyState
                title="No photos yet"
                description="Upload your first family photo to get started."
                action={
                  <button
                    onClick={() => setShowUpload(true)}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                  >
                    Upload photos
                  </button>
                }
              />
            ) : (
              <PhotoGrid
                photos={photos}
                onDelete={handleDeletePhoto}
                onSelect={setLightbox}
              />
            )}
          </section>
        </div>
      )}

      {lightbox && <Lightbox photo={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

function Lightbox({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div className="relative max-w-5xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
        <img
          src={photo.url ?? ''}
          alt={photo.title ?? photo.filename}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />
        {photo.title && (
          <p className="mt-2 text-center text-white text-sm">{photo.title}</p>
        )}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 rounded-full bg-black/60 text-white w-8 h-8 flex items-center justify-center hover:bg-black"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
