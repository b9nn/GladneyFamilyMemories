import { ArrowLeft, Trash2, X as XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthenticatedImage } from '@/components/shared/authenticated-image'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import type { AlbumWithPhotos, Photo } from '@/types/api'

interface AlbumViewProps {
  album: AlbumWithPhotos
  onBack: () => void
  onPhotoClick: (photo: Photo) => void
  onRemovePhoto: (photoId: number) => void
  onDeleteAlbum: () => void
}

export function AlbumView({ album, onBack, onPhotoClick, onRemovePhoto, onDeleteAlbum }: AlbumViewProps) {
  const { user } = useAuthStore()
  const isAdmin = user?.is_admin ?? false

  const sorted = [...album.photos].sort((a, b) => {
    const dateA = a.taken_at || a.created_at
    const dateB = b.taken_at || b.created_at
    return dateB.localeCompare(dateA)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to albums">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{album.name}</h2>
            {album.description && <p className="text-sm text-muted-foreground">{album.description}</p>}
            <p className="text-xs text-muted-foreground">{album.photos.length} photos</p>
          </div>
        </div>
        {isAdmin && (
          <Button variant="destructive" size="sm" onClick={onDeleteAlbum}>
            <Trash2 className="h-3.5 w-3.5" /> Delete Album
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {sorted.map((photo) => (
          <div key={photo.id} className="relative group">
            <button
              onClick={() => onPhotoClick(photo)}
              className="w-full aspect-square rounded-lg overflow-hidden bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={photo.title || photo.filename || 'View photo'}
            >
              <AuthenticatedImage
                photoId={photo.id}
                alt={photo.title || 'Photo'}
                className="w-full h-full object-cover"
              />
            </button>
            {isAdmin && (
              <button
                onClick={() => onRemovePhoto(photo.id)}
                className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                aria-label="Remove photo from album"
              >
                <XIcon className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
