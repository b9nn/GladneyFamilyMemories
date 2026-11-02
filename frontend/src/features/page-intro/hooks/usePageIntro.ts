import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pageIntroApi, type IntroPage } from '@/lib/api/pageIntro';
import { toast } from '@/stores/toast-store';
import { apiErrorMessage } from '@/lib/utils/api';
import type { PageIntro } from '@/types/api';

export function usePageIntro(page: IntroPage) {
  return useQuery({
    queryKey: ['page-intro', page],
    queryFn: () => pageIntroApi.get(page),
  });
}

export function useUpdatePageIntro(page: IntroPage) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PageIntro) => pageIntroApi.update(page, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['page-intro', page] }); toast('Introduction saved', 'success'); },
    onError: (err) => toast(apiErrorMessage(err, 'Failed to save introduction'), 'error'),
  });
}
