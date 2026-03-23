import { client } from './client'
import type { AudioRecording } from '@/types/api'
export const audioApi = {
  list: () => client.get<AudioRecording[]>('/api/audio').then(r => r.data),
  upload: (file: File, title?: string, description?: string, durationSeconds?: number) => {
    const form = new FormData()
    form.append('file', file)
    if (title) form.append('title', title)
    if (description) form.append('description', description)
    if (durationSeconds !== undefined) form.append('duration_seconds', String(durationSeconds))
    return client.post<AudioRecording>('/api/audio', form).then(r => r.data)
  },
  update: (id: number, data: { title?: string; description?: string }) => client.put<AudioRecording>(`/api/audio/${id}`, data).then(r => r.data),
  delete: (id: number) => client.delete(`/api/audio/${id}`).then(r => r.data),
}
