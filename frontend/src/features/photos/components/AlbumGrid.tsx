import type { Album } from '@/types/api';

interface AlbumGridProps {
  albums: Album[];
  onSelect: (album: Album) => void;
  onDelete: (id: number) => void;
}

export function AlbumGrid({ albums, onSelect, onDelete }: AlbumGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {albums.map((album) => (
        <div
          key={album.id}
          className="group relative rounded-lg border border-border bg-card overflow-hidden cursor-pointer hover:border-primary transition-colors"
          onClick={() => onSelect(album)}
        >
          {/* Cover — stack of photos effect */}
          <div className="aspect-square bg-muted relative flex items-center justify-center">
            {album.background_image ? (
              <img
                src={album.background_image}
                alt={album.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <span className="text-4xl">🗂️</span>
              </div>
            )}
            {/* Photo count badge */}
            <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white font-medium">
              {album.photo_count} {album.photo_count === 1 ? 'photo' : 'photos'}
            </div>
          </div>
          <div className="p-3 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground truncate">{album.name}</p>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(album.id); }}
              className="flex-shrink-0 text-xs text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
