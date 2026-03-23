import { useRef, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { useFiles, useUploadFile, useDeleteFile } from './hooks/useFiles';
import { formatDate } from '@/lib/utils/date';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string | null): string {
  if (!type) return '📄';
  if (type.includes('pdf')) return '📕';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('sheet') || type.includes('excel')) return '📊';
  if (type.includes('zip') || type.includes('compressed')) return '📦';
  if (type.includes('video')) return '🎬';
  if (type.includes('image')) return '🖼️';
  return '📄';
}

export function FilesPage() {
  const { data: files, isLoading } = useFiles();
  const uploadFile = useUploadFile();
  const deleteFile = useDeleteFile();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setError('');
    try {
      await uploadFile.mutateAsync({ file: selectedFile, title: title || undefined });
      setSelectedFile(null);
      setTitle('');
      setShowUpload(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleDelete(id: number) {
    if (!confirm('Delete this file?')) return;
    deleteFile.mutate(id);
  }

  return (
    <div>
      <PageHeader
        title="Files"
        description="Documents and other files"
        action={
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {showUpload ? 'Cancel' : 'Upload file'}
          </button>
        }
      />

      {showUpload && (
        <div className="mb-8 rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Upload file</h2>
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-1">
            <label htmlFor="file-title" className="text-sm font-medium text-foreground">Title (optional)</label>
            <input
              id="file-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div
            className="rounded-lg border-2 border-dashed border-border p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <p className="text-muted-foreground text-sm">
              {selectedFile ? selectedFile.name : 'Click to select a file'}
            </p>
            {selectedFile && (
              <p className="text-xs text-muted-foreground mt-1">{formatBytes(selectedFile.size)}</p>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {selectedFile && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg border border-border bg-muted animate-pulse" />
          ))}
        </div>
      ) : !files?.length ? (
        <EmptyState
          title="No files yet"
          description="Upload documents, PDFs, and other files for the family."
          action={
            <button
              onClick={() => setShowUpload(true)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Upload file
            </button>
          }
        />
      ) : (
        <div className="rounded-lg border border-border divide-y divide-border">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 transition-colors">
              <span className="text-2xl">{fileIcon(file.file_type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {file.title ?? file.filename}
                </p>
                <p className="text-xs text-muted-foreground">
                  {file.file_type ?? 'file'} · {formatDate(file.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {file.url && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Download
                  </a>
                )}
                <button
                  onClick={() => handleDelete(file.id)}
                  className="text-sm text-muted-foreground hover:text-destructive"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
