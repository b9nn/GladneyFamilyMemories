import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { audioApi } from '@/lib/api/audio';
import { toast } from '@/stores/toast-store';

const KEY = ['audio'];

export function useAudioList() {
  return useQuery({ queryKey: KEY, queryFn: audioApi.list });
}

export function useUploadAudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, title, durationSeconds }: { file: File; title?: string; durationSeconds?: number }) =>
      audioApi.upload(file, title, undefined, durationSeconds),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast('Audio saved', 'success'); },
  });
}

export function useDeleteAudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => audioApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast('Recording deleted', 'success'); },
  });
}

export function useUpdateAudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) => audioApi.update(id, { title }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast('Title updated', 'success'); },
  });
}
