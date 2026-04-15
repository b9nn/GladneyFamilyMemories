import { useMemo } from 'react'
import { AuthenticatedImage } from '@/components/shared/authenticated-image'
import type { Photo } from '@/types/api'

interface PhotoGridProps {
  photos: Photo[]
  onPhotoClick: (photo: Photo) => void
}

export function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
  const sorted = useMemo(
    () => [...photos].sort((a, b) => {
      const dateA = a.taken_at || a.created_at
      const dateB = b.taken_at || b.created_at
      return dateB.localeCompare(dateA)
    }),
    [photos]
  )

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
      {sorted.map((photo) => (
        <button
          key={photo.id}
          onClick={() => onPhotoClick(photo)}
          className="group relative aspect-square rounded-lg overflow-hidden bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={photo.title || photo.filename || 'View photo'}
        >
          <AuthenticatedImage
            photoId={photo.id}
            alt={photo.title || 'Photo'}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          {photo.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-xs truncate">{photo.title}</p>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
