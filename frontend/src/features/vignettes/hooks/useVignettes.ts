import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vignettesApi } from '@/lib/api/vignettes';
import { toast } from '@/stores/toast-store';
import type { VignetteCreate, VignetteUpdate } from '@/types/api';

const KEY = ['vignettes'];

export function useVignettes() {
  return useQuery({ queryKey: KEY, queryFn: vignettesApi.list });
}

export function useCreateVignette() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VignetteCreate) => vignettesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast('Vignette created', 'success'); },
  });
}

export function useUpdateVignette() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: VignetteUpdate }) => vignettesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast('Vignette saved', 'success'); },
  });
}

export function useDeleteVignette() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => vignettesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast('Vignette deleted', 'success'); },
  });
}

export function useReorderVignettes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { id: number; sort_order: number }[]) => vignettesApi.reorder(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAttachVignettePhoto(vignetteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => vignettesApi.attachPhoto(vignetteId, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDetachVignettePhoto(vignetteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vpId: number) => vignettesApi.detachPhoto(vignetteId, vpId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
