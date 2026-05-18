import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { weddingApi } from '@/lib/api/wedding';
import { toast } from '@/stores/toast-store';
import { apiErrorMessage } from '@/lib/utils/api';
import type { Photo } from '@/types/api';

const ALBUM_KEY = ['wedding', 'album'];
const PHOTOS_KEY = ['wedding', 'photos'];

export function useWeddingAlbum() {
  return useQuery({
    queryKey: ALBUM_KEY,
    queryFn: weddingApi.getAlbum,
    retry: 2,
    staleTime: 30_000,
  });
}

export function useUpsertWeddingAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      weddingApi.upsertAlbum(name, description),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ALBUM_KEY });
      toast('Album saved', 'success');
    },
    onError: (err) => toast(apiErrorMessage(err, 'Failed to save album'), 'error'),
  });
}

export function useWeddingPhotos() {
  return useQuery({
    queryKey: PHOTOS_KEY,
    queryFn: weddingApi.listPhotos,
    retry: 2,
    staleTime: 30_000,
    refetchOnMount: true,
  });
}

export function useUploadWeddingPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, title }: { file: File; title?: string }) => weddingApi.upload(file, title),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PHOTOS_KEY });
      qc.invalidateQueries({ queryKey: ALBUM_KEY });
      toast('Photo uploaded', 'success');
    },
    onError: (err) => toast(apiErrorMessage(err, 'Upload failed'), 'error'),
  });
}

export function useDeleteWeddingPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => weddingApi.deletePhoto(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PHOTOS_KEY });
      qc.invalidateQueries({ queryKey: ALBUM_KEY });
      toast('Photo deleted', 'success');
    },
    onError: (err) => toast(apiErrorMessage(err, 'Delete failed'), 'error'),
  });
}

export function useReorderWeddingPhotos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { photo_id: number; sort_order: number }[]) => weddingApi.reorderPhotos(items),
    onMutate: async (items) => {
      await qc.cancelQueries({ queryKey: PHOTOS_KEY });
      const previous = qc.getQueryData<Photo[]>(PHOTOS_KEY);
      if (previous) {
        const orderMap = new Map(items.map(i => [i.photo_id, i.sort_order]));
        qc.setQueryData<Photo[]>(PHOTOS_KEY, [...previous].sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)));
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(PHOTOS_KEY, ctx.previous);
    },
    onSettled: () => { qc.invalidateQueries({ queryKey: PHOTOS_KEY }); },
  });
}
