import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { audioApi } from '@/lib/api/audio';

const KEY = ['audio'];

export function useAudioList() {
  return useQuery({ queryKey: KEY, queryFn: audioApi.list });
}

export function useUploadAudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, title, durationSeconds }: { file: File; title?: string; durationSeconds?: number }) =>
      audioApi.upload(file, title, undefined, durationSeconds),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => audioApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
