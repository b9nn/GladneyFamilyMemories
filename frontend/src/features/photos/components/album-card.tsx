import { ImageIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { Album } from '@/types/api'

interface AlbumCardProps {
  album: Album
  onClick: () => void
}

export function AlbumCard({ album, onClick }: AlbumCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden" onClick={onClick}>
      {album.background_image ? (
        <div
          className="h-32 bg-cover bg-center"
          style={{ backgroundImage: `url(${album.background_image})` }}
        />
      ) : (
        <div className="h-32 bg-muted flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <CardContent className="p-3">
        <p className="font-medium truncate">{album.name}</p>
        {album.description && (
          <p className="text-sm text-muted-foreground truncate">{album.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {album.photo_count} photo{album.photo_count !== 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  )
}
