import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { weddingApi } from '@/lib/api/wedding';
import { toast } from '@/stores/toast-store';
import { apiErrorMessage } from '@/lib/utils/api';
import type { Photo } from '@/types/api';

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

export function useReorderWeddingPhotos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { photo_id: number; sort_order: number }[]) => weddingApi.reorderPhotos(items),
    onMutate: async (items) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<Photo[]>(KEY);
      if (previous) {
        const orderMap = new Map(items.map(i => [i.photo_id, i.sort_order]));
        qc.setQueryData<Photo[]>(KEY, [...previous].sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)));
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous);
    },
    onSettled: () => { qc.invalidateQueries({ queryKey: KEY }); },
  });
}
