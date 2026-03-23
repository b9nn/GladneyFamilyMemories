import type { Photo } from '@/types/api';

interface PhotoGridProps {
  photos: Photo[];
  onDelete: (id: number) => void;
  onSelect?: (photo: Photo) => void;
}

export function PhotoGrid({ photos, onDelete, onSelect }: PhotoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {photos.map((photo) => (
        <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
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
            <div className="flex items-end justify-between">
              {photo.title && (
                <p className="text-xs text-white font-medium truncate">{photo.title}</p>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }}
                className="ml-auto rounded bg-black/60 px-2 py-0.5 text-xs text-white hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
