import { client } from './client'
import type { SearchResult, TimelineItem, Tag, TagCreate, ContentTag, ContentTagCreate } from '@/types/api'
export const searchApi = {
  search: (q: string) => client.get<SearchResult[]>(`/api/search?q=${encodeURIComponent(q)}`).then(r => r.data),
  timeline: (contentTypes?: string, limit = 50, offset = 0) => {
    const p = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    if (contentTypes) p.set('content_types', contentTypes)
    return client.get<TimelineItem[]>(`/api/timeline?${p}`).then(r => r.data)
  },
}
export const tagsApi = {
  list: (category?: string) => client.get<Tag[]>(category ? `/api/tags?category=${category}` : '/api/tags').then(r => r.data),
  create: (data: TagCreate) => client.post<Tag>('/api/tags', data).then(r => r.data),
  delete: (id: number) => client.delete(`/api/tags/${id}`).then(r => r.data),
  addContentTag: (data: ContentTagCreate) => client.post<ContentTag>('/api/content-tags', data).then(r => r.data),
  removeContentTag: (id: number) => client.delete(`/api/content-tags/${id}`).then(r => r.data),
}
