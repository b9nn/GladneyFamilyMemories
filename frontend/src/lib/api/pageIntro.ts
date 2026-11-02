import { client } from './client'
import type { PageIntro } from '@/types/api'

export type IntroPage = 'dashboard' | 'family_trees'

export const pageIntroApi = {
  get: (page: IntroPage) => client.get<PageIntro>(`/api/page-intro/${page}`).then(r => r.data),
  update: (page: IntroPage, data: PageIntro) => client.put<PageIntro>(`/api/admin/page-intro/${page}`, data).then(r => r.data),
}
