import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { photosApi } from '@/lib/api/photos';
import { toast } from '@/stores/toast-store';
import type { PhotoUpdate } from '@/types/api';

const KEY = ['photos'];

export function usePhotos() {
  return useQuery({ queryKey: KEY, queryFn: photosApi.list, staleTime: 0, refetchOnMount: true });
}

export function useUploadPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, title, description }: { file: File; title?: string; description?: string }) =>
      photosApi.upload(file, title, description),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast('Photo uploaded', 'success'); },
  });
}

export function useUpdatePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PhotoUpdate }) => photosApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast('Photo updated', 'success'); },
  });
}

export function useDeletePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => photosApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast('Photo deleted', 'success'); },
  });
}
