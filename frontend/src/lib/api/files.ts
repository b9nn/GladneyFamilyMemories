import { client } from './client'
import type { FileRecord } from '@/types/api'
export const filesApi = {
  list: (source = 'files') => client.get<FileRecord[]>(`/api/files?source=${source}`).then(r => r.data),
  upload: (file: File, title?: string, description?: string, source = 'files') => {
    const form = new FormData()
    form.append('file', file)
    if (title) form.append('title', title)
    if (description) form.append('description', description)
    form.append('source', source)
    return client.post<FileRecord>('/api/files', form).then(r => r.data)
  },
  delete: (id: number) => client.delete(`/api/files/${id}`).then(r => r.data),
}
