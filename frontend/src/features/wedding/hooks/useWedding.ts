import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { weddingApi } from '@/lib/api/wedding';
import { toast } from '@/stores/toast-store';
import { apiErrorMessage } from '@/lib/utils/api';

const KEY = ['wedding', 'photos'];

export function useWeddingPhotos() {
  return useQuery({ queryKey: KEY, queryFn: weddingApi.listPhotos, staleTime: 0, refetchOnMount: true });
}

export function useUploadWeddingPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, title }: { file: File; title?: string }) => weddingApi.upload(file, title),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast('Photo uploaded', 'success'); },
    onError: (err) => toast(apiErrorMessage(err, 'Upload failed'), 'error'),
  });
}

export function useDeleteWeddingPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => weddingApi.deletePhoto(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast('Photo deleted', 'success'); },
    onError: (err) => toast(apiErrorMessage(err, 'Delete failed'), 'error'),
  });
}
