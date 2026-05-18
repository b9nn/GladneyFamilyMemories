import { client } from './client'
import type { Album, AlbumCreate, AlbumUpdate, Photo, PhotoUpdate } from '@/types/api'

export const weddingApi = {
  listAlbums: () => client.get<Album[]>('/api/wedding/albums').then(r => r.data),
  createAlbum: (data: AlbumCreate) => client.post<Album>('/api/wedding/albums', data).then(r => r.data),
  // Album operations by ID reuse the shared endpoints
  updateAlbum: (id: number, data: AlbumUpdate) => client.put<Album>(`/api/albums/${id}`, data).then(r => r.data),
  deleteAlbum: (id: number) => client.delete(`/api/albums/${id}`).then(r => r.data),
  reorderAlbums: (items: { id: number; sort_order: number }[]) => client.put('/api/albums/reorder', items).then(r => r.data),
  getAlbumPhotos: (albumId: number) => client.get<Photo[]>(`/api/albums/${albumId}/photos`).then(r => r.data),
  addPhotoToAlbum: (albumId: number, photoId: number) => client.post(`/api/albums/${albumId}/photos/${photoId}`).then(r => r.data),
  removePhotoFromAlbum: (albumId: number, photoId: number) => client.delete(`/api/albums/${albumId}/photos/${photoId}`).then(r => r.data),
  setAlbumCover: (albumId: number, photoId: number) => client.put<Album>(`/api/albums/${albumId}/cover/${photoId}`).then(r => r.data),
  reorderAlbumPhotos: (albumId: number, items: { photo_id: number; sort_order: number }[]) => client.put(`/api/albums/${albumId}/photos/reorder`, items).then(r => r.data),
  listPhotos: () => client.get<Photo[]>('/api/wedding/photos').then(r => r.data),
  uploadPhoto: (file: File, title?: string, description?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (title) form.append('title', title)
    if (description) form.append('description', description)
    return client.post<Photo>('/api/wedding/photos', form).then(r => r.data)
  },
  // Photo operations by ID reuse the shared endpoints
  updatePhoto: (id: number, data: PhotoUpdate) => client.put<Photo>(`/api/photos/${id}`, data).then(r => r.data),
  deletePhoto: (id: number) => client.delete(`/api/photos/${id}`).then(r => r.data),
}
