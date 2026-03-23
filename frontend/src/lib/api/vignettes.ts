import { client } from './client'
import type { Vignette, VignetteCreate, VignetteUpdate } from '@/types/api'
export const vignettesApi = {
  list: () => client.get<Vignette[]>('/api/vignettes').then(r => r.data),
  get: (id: number) => client.get<Vignette>(`/api/vignettes/${id}`).then(r => r.data),
  create: (data: VignetteCreate) => client.post<Vignette>('/api/vignettes', data).then(r => r.data),
  update: (id: number, data: VignetteUpdate) => client.put<Vignette>(`/api/vignettes/${id}`, data).then(r => r.data),
  delete: (id: number) => client.delete(`/api/vignettes/${id}`).then(r => r.data),
}
