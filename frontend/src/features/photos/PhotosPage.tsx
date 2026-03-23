import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { PhotoGrid } from './components/PhotoGrid';
import { PhotoUpload } from './components/PhotoUpload';
import { usePhotos, useDeletePhoto } from './hooks/usePhotos';
import type { Photo } from '@/types/api';

export function PhotosPage() {
  const { data: photos, isLoading } = usePhotos();
  const deletePhoto = useDeletePhoto();
  const [showUpload, setShowUpload] = useState(false);
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  function handleDelete(id: number) {
    if (!confirm('Delete this photo?')) return;
    deletePhoto.mutate(id);
  }

  return (
    <div>
      <PageHeader
        title="Photos"
        description="Family photos and albums"
        action={
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {showUpload ? 'Cancel' : 'Upload photos'}
          </button>
        }
      />

      {showUpload && (
        <div className="mb-8 rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Upload photos</h2>
          <PhotoUpload onDone={() => setShowUpload(false)} />
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : !photos?.length ? (
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
          onDelete={handleDelete}
          onSelect={setLightbox}
        />
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.url ?? ''}
              alt={lightbox.title ?? lightbox.filename}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {lightbox.title && (
              <p className="mt-2 text-center text-white text-sm">{lightbox.title}</p>
            )}
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-2 right-2 rounded-full bg-black/60 text-white w-8 h-8 flex items-center justify-center hover:bg-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
