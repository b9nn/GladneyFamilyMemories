import { useState } from 'react';
import type { Album } from '@/types/api';

interface AlbumGridProps {
  albums: Album[];
  isAdmin: boolean;
  onSelect: (album: Album) => void;
  onDelete: (id: number) => void;
  onDropPhoto?: (albumId: number, photoId: number) => void;
}

export function AlbumGrid({ albums, isAdmin, onSelect, onDelete, onDropPhoto }: AlbumGridProps) {
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {albums.map((album) => (
        <div
          key={album.id}
          className={`group relative rounded-lg border-2 bg-card overflow-hidden cursor-pointer transition-colors ${
            dragOverId === album.id
              ? 'border-primary scale-[1.02] shadow-lg'
              : 'border-border hover:border-primary'
          }`}
          onClick={() => onSelect(album)}
          onDragOver={(e) => { e.preventDefault(); setDragOverId(album.id); }}
          onDragLeave={() => setDragOverId(null)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverId(null);
            const photoId = Number(e.dataTransfer.getData('photoId'));
            if (photoId && onDropPhoto) onDropPhoto(album.id, photoId);
          }}
        >
          {/* Drop overlay */}
          {dragOverId === album.id && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/20 pointer-events-none">
              <span className="text-white font-semibold text-sm bg-primary/80 rounded-full px-3 py-1">Drop here</span>
            </div>
          )}
          {/* Title */}
          <div className="px-3 pt-3 pb-2 flex items-center justify-between gap-2">
            <p className="text-base font-semibold text-foreground truncate">{album.name}</p>
            {isAdmin && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(album.id); }}
                className="flex-shrink-0 text-xs text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Delete
              </button>
            )}
          </div>
          {/* Cover image or plain background */}
          <div className="aspect-square bg-muted relative overflow-hidden">
            {album.background_image && (
              <img
                src={album.background_image}
                alt={album.name}
                className="w-full h-full object-cover"
              />
            )}
            {/* Photo count badge */}
            <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white font-medium">
              {album.photo_count} {album.photo_count === 1 ? 'photo' : 'photos'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
