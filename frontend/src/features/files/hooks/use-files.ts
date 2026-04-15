import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { filesApi } from '@/lib/api/files'
import type { FileUpdate } from '@/types/api'

export function useFiles(source?: string) {
  return useQuery({
    queryKey: ['files', source],
    queryFn: () => filesApi.list(source),
  })
}

export function useUploadFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, title, source }: { file: File; title?: string; source?: string }) =>
      filesApi.upload(file, title, undefined, source),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files'] }),
  })
}

export function useUpdateFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: FileUpdate }) =>
      filesApi.update(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files'] }),
  })
}

export function useDeleteFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => filesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files'] }),
  })
}
