import { client } from './client'
import type { Album, Photo } from '@/types/api'

export const weddingApi = {
  getAlbum: () => client.get<Album>('/api/wedding/album').then(r => r.data),
  upsertAlbum: (name: string, description?: string) =>
    client.put<Album>('/api/wedding/album', { name, description }).then(r => r.data),
  listPhotos: () => client.get<Photo[]>('/api/wedding/photos').then(r => r.data),
  upload: (file: File, title?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (title) form.append('title', title)
    return client.post<Photo>('/api/wedding/photos', form).then(r => r.data)
  },
  deletePhoto: (id: number) => client.delete(`/api/wedding/photos/${id}`).then(r => r.data),
  reorderPhotos: (items: { photo_id: number; sort_order: number }[]) =>
    client.put('/api/wedding/photos/reorder', items).then(r => r.data),
}
