import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { audioApi } from '@/lib/api/audio'

export function useRecordings() {
  return useQuery({
    queryKey: ['audio'],
    queryFn: audioApi.list,
  })
}

export function useUploadRecording() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, title }: { file: File | Blob; title?: string }) =>
      audioApi.upload(file, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audio'] }),
  })
}

export function useUpdateRecording() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: { title?: string; description?: string } }) =>
      audioApi.update(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audio'] }),
  })
}

export function useDeleteRecording() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => audioApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audio'] }),
  })
}
