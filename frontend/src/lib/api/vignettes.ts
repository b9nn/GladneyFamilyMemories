import { client } from './client'
import type { Vignette, VignetteCreate, VignetteUpdate, VignettePhoto } from '@/types/api'
export const vignettesApi = {
  list: () => client.get<Vignette[]>('/api/vignettes').then(r => r.data),
  get: (id: number) => client.get<Vignette>(`/api/vignettes/${id}`).then(r => r.data),
  create: (data: VignetteCreate) => client.post<Vignette>('/api/vignettes', data).then(r => r.data),
  update: (id: number, data: VignetteUpdate) => client.put<Vignette>(`/api/vignettes/${id}`, data).then(r => r.data),
  delete: (id: number) => client.delete(`/api/vignettes/${id}`).then(r => r.data),
  attachPhoto: (vignetteId: number, file: File) => {
    const form = new FormData(); form.append('file', file);
    return client.post<VignettePhoto>(`/api/vignettes/${vignetteId}/photos`, form).then(r => r.data);
  },
  detachPhoto: (vignetteId: number, vpId: number) =>
    client.delete(`/api/vignettes/${vignetteId}/photos/${vpId}`).then(r => r.data),
  reorder: (items: { id: number; sort_order: number }[]) =>
    client.put('/api/vignettes/reorder', items).then(r => r.data),
}
