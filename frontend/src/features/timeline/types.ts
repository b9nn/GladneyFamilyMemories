export type ContentType = 'vignette' | 'photo' | 'audio' | 'file'

export interface TimelineEvent {
  id: string
  contentType: ContentType
  contentId: number
  title: string
  description: string | null
  date: string
  photoId?: number
}

export interface TimelineFilters {
  contentTypes: ContentType[]
  dateFrom: string
  dateTo: string
  tagIds: number[]
}

export const defaultFilters: TimelineFilters = {
  contentTypes: ['vignette', 'photo', 'audio', 'file'],
  dateFrom: '',
  dateTo: '',
  tagIds: [],
}
