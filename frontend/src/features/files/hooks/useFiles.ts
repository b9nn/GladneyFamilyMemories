import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesApi } from '@/lib/api/files';
import { toast } from '@/stores/toast-store';

const KEY = ['files'];

export function useFiles() {
  return useQuery({ queryKey: KEY, queryFn: () => filesApi.list('files') });
}

export function useUploadFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, title }: { file: File; title?: string }) =>
      filesApi.upload(file, title, undefined, 'files'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast('File uploaded', 'success'); },
  });
}

export function useUpdateFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { title?: string; description?: string } }) =>
      filesApi.update(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast('File updated', 'success'); },
  });
}

export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => filesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast('File deleted', 'success'); },
  });
}
