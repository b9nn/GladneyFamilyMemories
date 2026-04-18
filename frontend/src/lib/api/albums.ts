import { client } from './client'
import type { Album, AlbumCreate, AlbumUpdate, Photo } from '@/types/api'
export const albumsApi = {
  list: () => client.get<Album[]>('/api/albums').then(r => r.data),
  create: (data: AlbumCreate) => client.post<Album>('/api/albums', data).then(r => r.data),
  update: (id: number, data: AlbumUpdate) => client.put<Album>(`/api/albums/${id}`, data).then(r => r.data),
  reorder: (items: { id: number; sort_order: number }[]) => client.put('/api/albums/reorder', items).then(r => r.data),
  delete: (id: number) => client.delete(`/api/albums/${id}`).then(r => r.data),
  getPhotos: (albumId: number) => client.get<Photo[]>(`/api/albums/${albumId}/photos`).then(r => r.data),
  addPhoto: (albumId: number, photoId: number) => client.post(`/api/albums/${albumId}/photos/${photoId}`).then(r => r.data),
  removePhoto: (albumId: number, photoId: number) => client.delete(`/api/albums/${albumId}/photos/${photoId}`).then(r => r.data),
  setCover: (albumId: number, photoId: number) => client.put<Album>(`/api/albums/${albumId}/cover/${photoId}`).then(r => r.data),
  reorderPhotos: (albumId: number, items: { photo_id: number; sort_order: number }[]) =>
    client.put(`/api/albums/${albumId}/photos/reorder`, items).then(r => r.data),
}
