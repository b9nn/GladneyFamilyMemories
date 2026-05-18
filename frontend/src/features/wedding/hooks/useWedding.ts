import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { weddingApi } from '@/lib/api/wedding';
import { toast } from '@/stores/toast-store';
import { apiErrorMessage } from '@/lib/utils/api';
import type { Album, Photo, PhotoUpdate } from '@/types/api';

const WA = ['wedding', 'albums'];
const WP = ['wedding', 'photos'];
const albumPhotosKey = (id: number) => ['wedding', 'albums', id, 'photos'];

// ── Albums ────────────────────────────────────────────────────────────────────

export function useWeddingAlbums() {
  return useQuery({ queryKey: WA, queryFn: weddingApi.listAlbums, staleTime: 30_000, retry: 2 });
}

export function useCreateWeddingAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) => weddingApi.createAlbum(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: WA }); toast('Album created', 'success'); },
  });
}

export function useUpdateWeddingAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; description?: string; sort_order?: number } }) =>
      weddingApi.updateAlbum(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: WA }); toast('Album updated', 'success'); },
  });
}

export function useDeleteWeddingAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => weddingApi.deleteAlbum(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: WA }); toast('Album deleted', 'success'); },
  });
}

export function useReorderWeddingAlbums() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { id: number; sort_order: number }[]) => weddingApi.reorderAlbums(items),
    onMutate: async (items) => {
      await qc.cancelQueries({ queryKey: WA });
      const previous = qc.getQueryData<Album[]>(WA);
      if (previous) {
        const orderMap = new Map(items.map(i => [i.id, i.sort_order]));
        qc.setQueryData<Album[]>(WA, [...previous].sort((a, b) => (orderMap.get(a.id) ?? a.sort_order) - (orderMap.get(b.id) ?? b.sort_order)));
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => { if (ctx?.previous) qc.setQueryData(WA, ctx.previous); },
    onSettled: () => { qc.invalidateQueries({ queryKey: WA }); },
  });
}

export function useWeddingAlbumPhotos(albumId: number) {
  return useQuery({ queryKey: albumPhotosKey(albumId), queryFn: () => weddingApi.getAlbumPhotos(albumId) });
}

export function useAddPhotoToWeddingAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ albumId, photoId }: { albumId: number; photoId: number }) =>
      weddingApi.addPhotoToAlbum(albumId, photoId),
    onSuccess: (_data, { albumId }) => {
      qc.invalidateQueries({ queryKey: albumPhotosKey(albumId) });
      qc.invalidateQueries({ queryKey: WA });
      toast('Photo added to album', 'success');
    },
  });
}

export function useRemovePhotoFromWeddingAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ albumId, photoId }: { albumId: number; photoId: number }) =>
      weddingApi.removePhotoFromAlbum(albumId, photoId),
    onSuccess: (_data, { albumId }) => {
      qc.invalidateQueries({ queryKey: albumPhotosKey(albumId) });
      qc.invalidateQueries({ queryKey: WA });
    },
  });
}

export function useSetWeddingAlbumCover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ albumId, photoId }: { albumId: number; photoId: number }) =>
      weddingApi.setAlbumCover(albumId, photoId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: WA }); toast('Cover photo updated', 'success'); },
  });
}

export function useReorderWeddingAlbumPhotos(albumId: number) {
  const qc = useQueryClient();
  const key = albumPhotosKey(albumId);
  return useMutation({
    mutationFn: (items: { photo_id: number; sort_order: number }[]) => weddingApi.reorderAlbumPhotos(albumId, items),
    onMutate: async (items) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Photo[]>(key);
      if (previous) {
        const orderMap = new Map(items.map(i => [i.photo_id, i.sort_order]));
        qc.setQueryData<Photo[]>(key, [...previous].sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)));
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => { if (ctx?.previous) qc.setQueryData(key, ctx.previous); },
    onSettled: () => { qc.invalidateQueries({ queryKey: key }); },
  });
}

// ── Photos ────────────────────────────────────────────────────────────────────

export function useWeddingPhotos() {
  return useQuery({ queryKey: WP, queryFn: weddingApi.listPhotos, staleTime: 30_000, retry: 2, refetchOnMount: true });
}

export function useUploadWeddingPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, title, description }: { file: File; title?: string; description?: string }) =>
      weddingApi.uploadPhoto(file, title, description),
    onSuccess: () => { qc.invalidateQueries({ queryKey: WP }); toast('Photo uploaded', 'success'); },
    onError: (err) => toast(apiErrorMessage(err, 'Upload failed'), 'error'),
  });
}

export function useUpdateWeddingPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PhotoUpdate }) => weddingApi.updatePhoto(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: WP }); toast('Photo updated', 'success'); },
  });
}

export function useDeleteWeddingPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => weddingApi.deletePhoto(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: WP }); toast('Photo deleted', 'success'); },
    onError: (err) => toast(apiErrorMessage(err, 'Delete failed'), 'error'),
  });
}
