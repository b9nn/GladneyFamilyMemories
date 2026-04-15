import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { searchApi } from '@/lib/api/search'
import type { TagCreate } from '@/types/api'

export function useSearch(q: string, type?: string, tagIds?: number[]) {
  return useQuery({
    queryKey: ['search', q, type, tagIds],
    queryFn: () => searchApi.search(q, type, tagIds),
    enabled: q.length >= 2 || (tagIds != null && tagIds.length > 0),
  })
}

export function useTags() {
  return useQuery({ queryKey: ['tags'], queryFn: () => searchApi.getTags() })
}

export function useCreateTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: TagCreate) => searchApi.createTag(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  })
}

export function useDeleteTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => searchApi.deleteTag(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  })
}

export function useContentTags(contentType: string, contentId: number) {
  return useQuery({
    queryKey: ['content-tags', contentType, contentId],
    queryFn: () => searchApi.getContentTags(contentType, contentId),
    enabled: !!contentType && !!contentId,
  })
}

export function useAddTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ contentType, contentId, tagId }: { contentType: string; contentId: number; tagId: number }) =>
      searchApi.addTag(contentType, contentId, tagId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['content-tags', vars.contentType, vars.contentId] })
    },
  })
}

export function useRemoveTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ contentType, contentId, tagId }: { contentType: string; contentId: number; tagId: number }) =>
      searchApi.removeTag(contentType, contentId, tagId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['content-tags', vars.contentType, vars.contentId] })
    },
  })
}
