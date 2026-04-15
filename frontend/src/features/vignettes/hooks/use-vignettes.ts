import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vignettesApi } from '@/lib/api/vignettes'
import type { VignetteCreate, VignetteUpdate, SortOrderItem } from '@/types/api'

export function useVignettes() {
  return useQuery({ queryKey: ['vignettes'], queryFn: vignettesApi.list })
}

export function useCreateVignette() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: VignetteCreate) => vignettesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vignettes'] }),
  })
}

export function useUpdateVignette() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: VignetteUpdate }) => vignettesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vignettes'] }),
  })
}

export function usePatchVignette() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, fields }: { id: number; fields: Partial<VignetteUpdate> }) => vignettesApi.patch(id, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vignettes'] }),
  })
}

export function useDeleteVignette() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => vignettesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vignettes'] }),
  })
}

export function useReorderVignettes() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orders: SortOrderItem[]) => vignettesApi.reorder(orders),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vignettes'] }),
  })
}
