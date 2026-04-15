import { useState, useRef } from 'react'
import { Camera, Plus, Upload, ImageIcon, ArrowUpDown } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PhotoGrid } from './components/photo-grid'
import { PhotoModal } from './components/photo-modal'
import { AlbumCard } from './components/album-card'
import { AlbumView } from './components/album-view'
import { AlbumCreateDialog } from './components/album-create-dialog'
import { PhotoArrange } from './components/photo-arrange'
import { AlbumArrange } from './components/album-arrange'
import { usePhotos, useUploadPhoto, useUpdatePhoto, useDeletePhoto } from './hooks/use-photos'
import { useAlbums, useAlbum, useDeleteAlbum, useAddPhotoToAlbum, useRemovePhotoFromAlbum } from './hooks/use-albums'
import { TagFilter } from '@/features/search/components/tag-filter'
import { useSearch } from '@/features/search/hooks/use-search'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import type { Photo } from '@/types/api'

export function PhotosPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.is_admin ?? false

  const { data: photos, isLoading: loadingPhotos } = usePhotos()
  const { data: albums, isLoading: loadingAlbums } = useAlbums()
  const uploadPhoto = useUploadPhoto()
  const updatePhoto = useUpdatePhoto()
  const deletePhoto = useDeletePhoto()
  const deleteAlbum = useDeleteAlbum()
  const addPhotoToAlbum = useAddPhotoToAlbum()
  const removePhotoFromAlbum = useRemovePhotoFromAlbum()

  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [deletingPhoto, setDeletingPhoto] = useState<Photo | null>(null)
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null)
  const [deletingAlbumId, setDeletingAlbumId] = useState<number | null>(null)
  const [showCreateAlbum, setShowCreateAlbum] = useState(false)
  const [arrangePhotos, setArrangePhotos] = useState(false)
  const [arrangeAlbums, setArrangeAlbums] = useState(false)
  const [filterTagIds, setFilterTagIds] = useState<number[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: albumData } = useAlbum(selectedAlbumId)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    try {
      await Promise.all(files.map((file) => uploadPhoto.mutateAsync({ file, title: file.name })))
    } catch {
      // handled per-file
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Tag filter
  const { data: tagResults } = useSearch('', undefined, filterTagIds.length > 0 ? filterTagIds : undefined)
  const tagAllowSet = filterTagIds.length > 0 && tagResults
    ? new Set(tagResults.filter((r) => r.content_type === 'photo').map((r) => r.content_id))
    : null

  const filteredPhotos = tagAllowSet
    ? (photos || []).filter((p) => tagAllowSet.has(p.id))
    : photos

  const isLoading = loadingPhotos || loadingAlbums

  // Album detail view
  if (selectedAlbumId && albumData) {
    return (
      <div>
        <AlbumView
          album={albumData}
          onBack={() => setSelectedAlbumId(null)}
          onPhotoClick={setSelectedPhoto}
          onRemovePhoto={(photoId) => removePhotoFromAlbum.mutate({ albumId: selectedAlbumId, photoId })}
          onDeleteAlbum={() => setDeletingAlbumId(selectedAlbumId)}
        />

        {selectedPhoto && (
          <PhotoModal
            photo={selectedPhoto}
            albums={albums || []}
            onClose={() => setSelectedPhoto(null)}
            onUpdateTitle={(title) => updatePhoto.mutate({ id: selectedPhoto.id, updates: { title } })}
            onUpdateDate={(taken_at) => updatePhoto.mutate({ id: selectedPhoto.id, updates: { taken_at } })}
            onAddToAlbum={(albumId) => addPhotoToAlbum.mutate({ albumId, photoId: selectedPhoto.id })}
            onDelete={() => { setDeletingPhoto(selectedPhoto); setSelectedPhoto(null) }}
          />
        )}

        <ConfirmDialog
          open={!!deletingAlbumId}
          onOpenChange={() => setDeletingAlbumId(null)}
          title="Delete Album"
          description="Delete this album? Photos in the album won't be deleted."
          confirmLabel="Delete" destructive
          onConfirm={() => {
            if (deletingAlbumId) { deleteAlbum.mutate(deletingAlbumId); setSelectedAlbumId(null) }
          }}
        />
        <ConfirmDialog
          open={!!deletingPhoto}
          onOpenChange={() => setDeletingPhoto(null)}
          title="Delete Photo"
          description="Delete this photo permanently?"
          confirmLabel="Delete" destructive
          onConfirm={() => { if (deletingPhoto) deletePhoto.mutate(deletingPhoto.id) }}
        />
      </div>
    )
  }

  // Main gallery view
  return (
    <div>
      <PageHeader
        title="Photos"
        description="Family photo gallery and albums"
        actions={
          isAdmin ? (
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Upload className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Upload Photos'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateAlbum(true)}>
                <Plus className="h-4 w-4" /> New Album
              </Button>
            </div>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          {/* Albums section */}
          {(albums?.length ?? 0) > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" /> Albums
                </h2>
                {isAdmin && !arrangeAlbums && (
                  <Button variant="ghost" size="sm" onClick={() => setArrangeAlbums(true)}>
                    <ArrowUpDown className="h-3.5 w-3.5" /> Arrange
                  </Button>
                )}
              </div>
              {arrangeAlbums ? (
                <AlbumArrange albums={albums!} onDone={() => setArrangeAlbums(false)} />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {albums!.map((album) => (
                    <AlbumCard key={album.id} album={album} onClick={() => setSelectedAlbumId(album.id)} />
                  ))}
                </div>
              )}
              <Separator className="mt-6" />
            </div>
          )}

          {/* Tag filter */}
          <div className="mb-4">
            <TagFilter selectedTagIds={filterTagIds} onChange={setFilterTagIds} />
          </div>

          {/* All photos */}
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Camera className="h-5 w-5" /> All Photos
            </h2>
            {isAdmin && !arrangePhotos && filteredPhotos?.length ? (
              <Button variant="ghost" size="sm" onClick={() => setArrangePhotos(true)}>
                <ArrowUpDown className="h-3.5 w-3.5" /> Arrange
              </Button>
            ) : null}
          </div>
          {!filteredPhotos?.length ? (
            <EmptyState
              icon={Camera}
              title={filterTagIds.length > 0 ? "No matching photos" : "No photos yet"}
              description={filterTagIds.length > 0 ? "No photos match the selected tags." : isAdmin ? "Upload some photos to get started." : "No photos have been shared yet."}
            />
          ) : arrangePhotos ? (
            <PhotoArrange photos={filteredPhotos} onDone={() => setArrangePhotos(false)} />
          ) : (
            <PhotoGrid photos={filteredPhotos} onPhotoClick={setSelectedPhoto} />
          )}
        </>
      )}

      {/* Photo modal */}
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          albums={albums || []}
          onClose={() => setSelectedPhoto(null)}
          onUpdateTitle={(title) => updatePhoto.mutate({ id: selectedPhoto.id, updates: { title } })}
          onUpdateDate={(taken_at) => updatePhoto.mutate({ id: selectedPhoto.id, updates: { taken_at } })}
          onAddToAlbum={(albumId) => addPhotoToAlbum.mutate({ albumId, photoId: selectedPhoto.id })}
          onDelete={() => { setDeletingPhoto(selectedPhoto); setSelectedPhoto(null) }}
        />
      )}

      <AlbumCreateDialog open={showCreateAlbum} onClose={() => setShowCreateAlbum(false)} />

      <ConfirmDialog
        open={!!deletingPhoto}
        onOpenChange={() => setDeletingPhoto(null)}
        title="Delete Photo"
        description="Delete this photo permanently?"
        confirmLabel="Delete" destructive
        onConfirm={() => { if (deletingPhoto) deletePhoto.mutate(deletingPhoto.id) }}
      />
    </div>
  )
}

export default PhotosPage
