import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { vignettesApi } from '@/lib/api/vignettes'
import { photosApi } from '@/lib/api/photos'
import { audioApi } from '@/lib/api/audio'
import { filesApi } from '@/lib/api/files'
import { searchApi } from '@/lib/api/search'
import type { TimelineEvent, TimelineFilters } from '../types'

export function useTimeline(filters: TimelineFilters) {
  const vignettes = useQuery({ queryKey: ['vignettes'], queryFn: vignettesApi.list })
  const photos = useQuery({ queryKey: ['photos'], queryFn: () => photosApi.list() })
  const audio = useQuery({ queryKey: ['audio'], queryFn: audioApi.list })
  const files = useQuery({ queryKey: ['files', 'files'], queryFn: () => filesApi.list('files') })

  // When tag filters are active, fetch matching content IDs from search API
  const taggedResults = useQuery({
    queryKey: ['search', '', undefined, filters.tagIds],
    queryFn: () => searchApi.search('', undefined, filters.tagIds),
    enabled: filters.tagIds.length > 0,
  })

  const isLoading = vignettes.isLoading || photos.isLoading || audio.isLoading || files.isLoading || (filters.tagIds.length > 0 && taggedResults.isLoading)

  const events = useMemo<TimelineEvent[]>(() => {
    const all: TimelineEvent[] = []

    if (filters.contentTypes.includes('vignette')) {
      for (const v of vignettes.data || []) {
        all.push({
          id: `vignette-${v.id}`,
          contentType: 'vignette',
          contentId: v.id,
          title: v.title,
          description: v.content?.slice(0, 200) ?? null,
          date: v.created_at,
        })
      }
    }

    if (filters.contentTypes.includes('photo')) {
      for (const p of photos.data || []) {
        all.push({
          id: `photo-${p.id}`,
          contentType: 'photo',
          contentId: p.id,
          title: p.title || p.filename,
          description: p.description,
          date: p.taken_at || p.created_at,
          photoId: p.id,
        })
      }
    }

    if (filters.contentTypes.includes('audio')) {
      for (const a of audio.data || []) {
        all.push({
          id: `audio-${a.id}`,
          contentType: 'audio',
          contentId: a.id,
          title: a.title || a.filename,
          description: a.description,
          date: a.created_at,
        })
      }
    }

    if (filters.contentTypes.includes('file')) {
      for (const f of files.data || []) {
        all.push({
          id: `file-${f.id}`,
          contentType: 'file',
          contentId: f.id,
          title: f.title || f.filename,
          description: f.description,
          date: f.created_at,
        })
      }
    }

    // Build set of allowed IDs when tag filter is active
    const tagAllowSet = filters.tagIds.length > 0 && taggedResults.data
      ? new Set(taggedResults.data.map((r) => `${r.content_type}-${r.content_id}`))
      : null

    // Apply date and tag filters
    const filtered = all.filter((e) => {
      if (filters.dateFrom && e.date < filters.dateFrom) return false
      if (filters.dateTo && e.date > filters.dateTo) return false
      if (tagAllowSet && !tagAllowSet.has(`${e.contentType}-${e.contentId}`)) return false
      return true
    })

    // Sort newest first
    filtered.sort((a, b) => b.date.localeCompare(a.date))
    return filtered
  }, [vignettes.data, photos.data, audio.data, files.data, filters, taggedResults.data])

  // Extract distinct years for markers
  const years = useMemo(() => {
    const set = new Set(events.map((e) => new Date(e.date).getFullYear()))
    return Array.from(set).sort((a, b) => b - a)
  }, [events])

  return { events, years, isLoading }
}
