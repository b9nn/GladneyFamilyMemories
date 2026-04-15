import { useState } from 'react'
import { X, Pencil, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { AuthenticatedImage } from '@/components/shared/authenticated-image'
import { formatDate } from '@/lib/utils/date'
import { TagInput } from '@/features/search/components/tag-input'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import type { Photo, Album } from '@/types/api'

interface PhotoModalProps {
  photo: Photo
  albums: Album[]
  onClose: () => void
  onUpdateTitle: (title: string) => void
  onUpdateDate: (date: string) => void
  onAddToAlbum: (albumId: number) => void
  onDelete: () => void
}

export function PhotoModal({ photo, albums, onClose, onUpdateTitle, onUpdateDate, onAddToAlbum, onDelete }: PhotoModalProps) {
  const { user } = useAuthStore()
  const isAdmin = user?.is_admin ?? false

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(photo.title || '')
  const [editingDate, setEditingDate] = useState(false)
  const [dateValue, setDateValue] = useState(photo.taken_at?.split('T')[0] || '')

  const handleSaveTitle = () => { onUpdateTitle(titleValue); setEditingTitle(false) }
  const handleSaveDate = () => { onUpdateDate(new Date(dateValue).toISOString()); setEditingDate(false) }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      <div
        className="relative max-w-4xl w-full mx-4 bg-background rounded-lg overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button onClick={onClose} className="absolute top-3 right-3 z-10 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70" aria-label="Close photo">
          <X className="h-5 w-5" />
        </button>

        {/* Image */}
        <div className="flex-1 min-h-0 flex items-center justify-center bg-black p-4">
          <AuthenticatedImage
            photoId={photo.id}
            alt={photo.title || 'Photo'}
            className="max-w-full max-h-[40vh] sm:max-h-[60vh] object-contain"
          />
        </div>

        {/* Info panel */}
        <div className="p-4 space-y-3 border-t">
          {/* Title */}
          <div className="flex items-center gap-2">
            {editingTitle ? (
              <>
                <Input value={titleValue} onChange={(e) => setTitleValue(e.target.value)} className="flex-1" autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()} />
                <Button size="icon" variant="ghost" onClick={handleSaveTitle} aria-label="Save title"><Check className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingTitle(false)} aria-label="Cancel title edit"><X className="h-4 w-4" /></Button>
              </>
            ) : (
              <>
                <h3 className="font-medium">{photo.title || photo.filename}</h3>
                {isAdmin && (
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingTitle(true)} aria-label="Edit title">
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {editingDate ? (
              <>
                <Input type="date" value={dateValue} onChange={(e) => setDateValue(e.target.value)} className="w-40 h-8 text-xs" />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveDate} aria-label="Save date"><Check className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingDate(false)} aria-label="Cancel date edit"><X className="h-3 w-3" /></Button>
              </>
            ) : (
              <>
                <span>
                  {photo.taken_at ? `Photo taken: ${formatDate(photo.taken_at)}` : 'Date not set'}
                </span>
                {isAdmin && (
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingDate(true)} aria-label="Edit date">
                    <Pencil className="h-2.5 w-2.5" />
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Tags */}
          {isAdmin && (
            <div className="pt-2 border-t">
              <TagInput contentType="photo" contentId={photo.id} />
            </div>
          )}

          {/* Admin actions */}
          {isAdmin && (
            <div className="flex items-center gap-2 pt-2 border-t">
              {albums.length > 0 && (
                <Select onChange={(e) => { if (e.target.value) onAddToAlbum(Number(e.target.value)) }} defaultValue="">
                  <option value="">Add to album...</option>
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>{album.name}</option>
                  ))}
                </Select>
              )}
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
