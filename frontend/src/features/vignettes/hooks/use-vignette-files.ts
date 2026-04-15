import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { filesApi } from '@/lib/api/files'
import type { FileUpdate } from '@/types/api'

export function useVignetteFiles() {
  return useQuery({
    queryKey: ['files', 'vignettes'],
    queryFn: () => filesApi.list('vignettes'),
  })
}

export function useUploadVignetteFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => filesApi.upload(file, file.name, undefined, 'vignettes'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files', 'vignettes'] }),
  })
}

export function usePatchVignetteFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, fields }: { id: number; fields: Partial<FileUpdate> }) => filesApi.patch(id, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files', 'vignettes'] }),
  })
}

export function useDeleteVignetteFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => filesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files', 'vignettes'] }),
  })
}
