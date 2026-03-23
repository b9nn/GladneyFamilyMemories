import { client } from './client'
import type { Photo, PhotoUpdate } from '@/types/api'
export const photosApi = {
  list: () => client.get<Photo[]>('/api/photos').then(r => r.data),
  upload: (file: File, title?: string, description?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (title) form.append('title', title)
    if (description) form.append('description', description)
    return client.post<Photo>('/api/photos', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },
  update: (id: number, data: PhotoUpdate) => client.put<Photo>(`/api/photos/${id}`, data).then(r => r.data),
  delete: (id: number) => client.delete(`/api/photos/${id}`).then(r => r.data),
}
