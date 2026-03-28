import type { Album, Photo } from '@/types/api';
import { PhotoGrid } from './PhotoGrid';
import { useAlbumPhotos, useRemovePhotoFromAlbum, useAddPhotoToAlbum, useSetAlbumCover } from '../hooks/useAlbums';
import { usePhotos } from '../hooks/usePhotos';
import { useState } from 'react';
import { useIsAdmin } from '@/lib/utils/useIsAdmin';

interface AlbumViewProps {
  album: Album;
  onBack: () => void;
  onLightbox: (photo: Photo) => void;
}

export function AlbumView({ album, onBack, onLightbox }: AlbumViewProps) {
  const isAdmin = useIsAdmin();
  const { data: albumPhotos, isLoading } = useAlbumPhotos(album.id);
  const { data: allPhotos } = usePhotos();
  const removePhoto = useRemovePhotoFromAlbum();
  const addPhoto = useAddPhotoToAlbum();
  const setCover = useSetAlbumCover();
  const [showAddPanel, setShowAddPanel] = useState(false);

  const albumPhotoIds = new Set(albumPhotos?.map((p) => p.id) ?? []);
  const availableToAdd = allPhotos?.filter((p) => !albumPhotoIds.has(p.id)) ?? [];

  function handleRemove(photoId: number) {
    removePhoto.mutate({ albumId: album.id, photoId });
  }

  function handleAdd(photoId: number) {
    addPhoto.mutate({ albumId: album.id, photoId });
  }

  return (
    <div>
      {/* Back nav + header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          ← Photos
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

      {/* Add photos panel */}
      {showAddPanel && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground mb-3">
            Click a photo to add it to this album
          </p>
          {!availableToAdd.length ? (
            <p className="text-sm text-muted-foreground">All photos are already in this album.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
              {availableToAdd.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => handleAdd(photo.id)}
                  className="aspect-square rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                >
                  {photo.url ? (
                    <img src={photo.url} alt={photo.title ?? photo.filename} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">?</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Album photos */}
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
          onDelete={handleRemove}
          onSelect={onLightbox}
          onSetCover={isAdmin ? (photo) => setCover.mutate({ albumId: album.id, photoId: photo.id }) : undefined}
          deleteLabel="Remove"
        />
      )}
    </div>
  );
}
