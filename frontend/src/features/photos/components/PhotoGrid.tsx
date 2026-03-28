import { useState } from 'react';
import { formatDate } from '@/lib/utils/date';
import type { Photo, PhotoUpdate } from '@/types/api';

interface PhotoGridProps {
  photos: Photo[];
  isAdmin?: boolean;
  onDelete: (id: number) => void;
  onSelect?: (photo: Photo) => void;
  onSetCover?: (photo: Photo) => void;
  onUpdate?: (id: number, data: PhotoUpdate) => void;
  deleteLabel?: string;
  draggable?: boolean;
  showDetails?: boolean;
}

interface PhotoCardProps {
  photo: Photo;
  isAdmin: boolean;
  onDelete: (id: number) => void;
  onSelect?: (photo: Photo) => void;
  onSetCover?: (photo: Photo) => void;
  onUpdate?: (id: number, data: PhotoUpdate) => void;
  deleteLabel: string;
  draggable: boolean;
  showDetails: boolean;
}

function PhotoCard({ photo, isAdmin, onDelete, onSelect, onSetCover, onUpdate, deleteLabel, draggable, showDetails }: PhotoCardProps) {
  const [takenAt, setTakenAt] = useState(photo.taken_at ? photo.taken_at.slice(0, 10) : '');

  function handleTakenAtBlur() {
    const original = photo.taken_at ? photo.taken_at.slice(0, 10) : '';
    if (takenAt !== original && onUpdate) {
      onUpdate(photo.id, { taken_at: takenAt || undefined });
    }
  }

  return (
    <div
      className={`group rounded-lg bg-card overflow-hidden border border-border ${showDetails ? '' : 'relative aspect-square'}`}
      draggable={draggable}
      onDragStart={draggable ? (e) => e.dataTransfer.setData('photoId', String(photo.id)) : undefined}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {photo.url ? (
          <img
            src={photo.url}
            alt={photo.title ?? photo.filename}
            className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
            onClick={() => onSelect?.(photo)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No preview
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
        <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-end justify-between gap-1">
            {!showDetails && photo.title && (
              <p className="text-xs text-white font-medium truncate">{photo.title}</p>
            )}
            {isAdmin && (
              <div className="ml-auto flex gap-1">
                {onSetCover && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSetCover(photo); }}
                    className="rounded bg-black/60 px-2 py-0.5 text-xs text-white hover:bg-primary transition-colors"
                  >
                    Set cover
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }}
                  className="rounded bg-black/60 px-2 py-0.5 text-xs text-white hover:bg-red-500 transition-colors"
                >
                  {deleteLabel}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details panel — admin only */}
      {showDetails && (
        <div className="p-2 space-y-1">
          <p className="text-xs text-foreground truncate" title={photo.filename}>
            {photo.title ?? photo.filename}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground flex-shrink-0">Taken:</span>
            <input
              type="date"
              value={takenAt}
              onChange={(e) => setTakenAt(e.target.value)}
              onBlur={handleTakenAtBlur}
              className="text-xs bg-transparent border-b border-border text-foreground focus:outline-none focus:border-primary w-full"
            />
          </div>
          <p className="text-xs text-muted-foreground">↑ {formatDate(photo.created_at)}</p>
        </div>
      )}
    </div>
  );
}

export function PhotoGrid({ photos, isAdmin = false, onDelete, onSelect, onSetCover, onUpdate, deleteLabel = 'Delete', draggable = false, showDetails = false }: PhotoGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          isAdmin={isAdmin}
          onDelete={onDelete}
          onSelect={onSelect}
          onSetCover={onSetCover}
          onUpdate={onUpdate}
          deleteLabel={deleteLabel}
          draggable={draggable}
          showDetails={showDetails}
        />
      ))}
    </div>
  );
}
