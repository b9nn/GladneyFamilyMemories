import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { albumsApi } from '@/lib/api/albums'
import type { AlbumCreate, SortOrderItem } from '@/types/api'

export function useAlbums() {
  return useQuery({ queryKey: ['albums'], queryFn: albumsApi.list })
}

export function useAlbum(id: number | null) {
  return useQuery({
    queryKey: ['albums', id],
    queryFn: () => albumsApi.get(id!),
    enabled: !!id,
  })
}

export function useCreateAlbum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AlbumCreate) => albumsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['albums'] }),
  })
}

export function useDeleteAlbum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => albumsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['albums'] }),
  })
}

export function useAddPhotoToAlbum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ albumId, photoId }: { albumId: number; photoId: number }) =>
      albumsApi.addPhoto(albumId, photoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['albums'] }),
  })
}

export function useRemovePhotoFromAlbum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ albumId, photoId }: { albumId: number; photoId: number }) =>
      albumsApi.removePhoto(albumId, photoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['albums'] }),
  })
}

export function useReorderAlbums() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orders: SortOrderItem[]) => albumsApi.reorder(orders),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['albums'] }),
  })
}

export function useUploadAlbumBackground() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ albumId, file }: { albumId: number; file: File }) =>
      albumsApi.uploadBackground(albumId, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['albums'] }),
  })
}
