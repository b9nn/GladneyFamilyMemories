import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/lib/api/search';

export function useTimeline(contentTypes?: string) {
  return useQuery({
    queryKey: ['timeline', contentTypes ?? 'all'],
    queryFn: () => searchApi.timeline(contentTypes, 100, 0),
  });
}
