import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vignettesApi } from '@/lib/api/vignettes';
import type { VignetteCreate, VignetteUpdate } from '@/types/api';

const KEY = ['vignettes'];

export function useVignettes() {
  return useQuery({ queryKey: KEY, queryFn: vignettesApi.list });
}

export function useCreateVignette() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VignetteCreate) => vignettesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateVignette() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: VignetteUpdate }) => vignettesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteVignette() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => vignettesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
