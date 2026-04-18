import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { albumsApi } from '@/lib/api/albums';
import { toast } from '@/stores/toast-store';
import type { Album, AlbumCreate, AlbumUpdate } from '@/types/api';

const KEY = ['albums'];
const albumPhotosKey = (id: number) => ['albums', id, 'photos'];

export function useAlbums() {
  return useQuery({ queryKey: KEY, queryFn: albumsApi.list, staleTime: 0, refetchOnMount: true });
}

export function useAlbumPhotos(albumId: number) {
  return useQuery({ queryKey: albumPhotosKey(albumId), queryFn: () => albumsApi.getPhotos(albumId) });
}

export function useCreateAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AlbumCreate) => albumsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast('Album created', 'success'); },
  });
}

export function useUpdateAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AlbumUpdate }) => albumsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast('Album updated', 'success'); },
  });
}

export function useDeleteAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => albumsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast('Album deleted', 'success'); },
  });
}

export function useAddPhotoToAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ albumId, photoId }: { albumId: number; photoId: number }) =>
      albumsApi.addPhoto(albumId, photoId),
    onSuccess: (_data, { albumId }) => {
      qc.invalidateQueries({ queryKey: albumPhotosKey(albumId) });
      qc.invalidateQueries({ queryKey: KEY });
      toast('Photo added to album', 'success');
    },
  });
}

export function useRemovePhotoFromAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ albumId, photoId }: { albumId: number; photoId: number }) =>
      albumsApi.removePhoto(albumId, photoId),
    onSuccess: (_data, { albumId }) => {
      qc.invalidateQueries({ queryKey: albumPhotosKey(albumId) });
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useSetAlbumCover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ albumId, photoId }: { albumId: number; photoId: number }) =>
      albumsApi.setCover(albumId, photoId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast('Cover photo updated', 'success'); },
  });
}

export function useReorderAlbums() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { id: number; sort_order: number }[]) => albumsApi.reorder(items),
    onMutate: async (items) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<Album[]>(KEY);
      if (previous) {
        const orderMap = new Map(items.map(i => [i.id, i.sort_order]));
        qc.setQueryData<Album[]>(KEY, [...previous].sort((a, b) => (orderMap.get(a.id) ?? a.sort_order) - (orderMap.get(b.id) ?? b.sort_order)));
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous);
    },
    onSettled: () => { qc.invalidateQueries({ queryKey: KEY }); },
  });
}
