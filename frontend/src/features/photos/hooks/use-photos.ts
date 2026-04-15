import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { photosApi } from '@/lib/api/photos'
import type { PhotoUpdate, SortOrderItem } from '@/types/api'

export function usePhotos() {
  return useQuery({ queryKey: ['photos'], queryFn: () => photosApi.list() })
}

export function useUploadPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, title }: { file: File; title?: string }) => photosApi.upload(file, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['photos'] }),
  })
}

export function useUpdatePhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: PhotoUpdate }) => photosApi.update(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['photos'] })
      qc.invalidateQueries({ queryKey: ['albums'] })
    },
  })
}

export function useDeletePhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => photosApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['photos'] })
      qc.invalidateQueries({ queryKey: ['albums'] })
    },
  })
}

export function useReorderPhotos() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orders: SortOrderItem[]) => photosApi.reorder(orders),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['photos'] }),
  })
}
