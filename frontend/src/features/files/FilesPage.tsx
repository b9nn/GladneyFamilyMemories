import { useRef, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { useFiles, useUploadFile, useDeleteFile } from './hooks/useFiles';
import { useIsAdmin } from '@/lib/utils/useIsAdmin';
import type { FileRecord } from '@/types/api';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getViewerType(type: string | null): 'pdf' | 'image' | 'video' | 'audio' | 'office' | 'none' {
  if (!type) return 'none';
  if (type.includes('pdf')) return 'pdf';
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type.includes('word') || type.includes('document') ||
      type.includes('sheet') || type.includes('excel') ||
      type.includes('presentation') || type.includes('powerpoint')) return 'office';
  return 'none';
}

function FileViewer({ file, onClose }: { file: FileRecord; onClose: () => void }) {
  const kind = getViewerType(file.file_type);
  const url = file.url ?? '';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black flex-shrink-0">
        <p className="text-sm font-medium text-white truncate">{file.title ?? file.filename}</p>
        <div className="flex items-center gap-4 ml-4 flex-shrink-0">
          {url && (
            <a
              href={url}
              download
              className="text-xs text-white/70 hover:text-white underline"
            >
              Download
            </a>
          )}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-md bg-white/20 hover:bg-white/40 px-3 py-1.5 text-sm font-semibold text-white transition-colors"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        {kind === 'pdf' && (
          <iframe
            src={url}
            className="w-full h-full rounded"
            title={file.title ?? file.filename}
          />
        )}
        {kind === 'image' && (
          <img
            src={url}
            alt={file.title ?? file.filename}
            className="max-w-full max-h-full object-contain rounded"
          />
        )}
        {kind === 'video' && (
          <video src={url} controls autoPlay className="max-w-full max-h-full rounded">
            Your browser does not support video playback.
          </video>
        )}
        {kind === 'audio' && (
          <div className="bg-card rounded-lg p-8 text-center space-y-4">
            <p className="text-foreground font-medium">{file.title ?? file.filename}</p>
            <audio src={url} controls autoPlay className="w-full" />
          </div>
        )}
        {kind === 'office' && (
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
            className="w-full h-full rounded"
            title={file.title ?? file.filename}
          />
        )}
        {kind === 'none' && (
          <div className="bg-card rounded-lg p-10 text-center space-y-4">
            <p className="text-foreground font-medium">{file.title ?? file.filename}</p>
            <p className="text-sm text-muted-foreground">This file type cannot be previewed.</p>
            {url && (
              <a
                href={url}
                download
                className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Download
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function FilesPage() {
  const { data: files, isLoading } = useFiles();
  const uploadFile = useUploadFile();
  const deleteFile = useDeleteFile();
  const isAdmin = useIsAdmin();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState<FileRecord | null>(null);

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
        action={isAdmin ? (
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {showUpload ? 'Cancel' : 'Upload file'}
          </button>
        ) : undefined}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 rounded-lg border border-border bg-muted animate-pulse" />
          ))}
        </div>
      ) : !files?.length ? (
        <EmptyState
          title="No files yet"
          description="Upload documents, PDFs, and other files for the family."
          action={isAdmin ? (
            <button
              onClick={() => setShowUpload(true)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Upload file
            </button>
          ) : undefined}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {files.map((file) => (
            <div key={file.id} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors text-center">
              <p className="text-sm font-medium text-foreground truncate w-full">
                {file.title ?? file.filename}
              </p>
              <div className="flex gap-3 mt-auto pt-2">
                {file.url && (
                  <button
                    onClick={() => setViewing(file)}
                    className="text-xs text-primary hover:underline"
                  >
                    Open
                  </button>
                )}
                {file.url && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Download
                  </a>
                )}
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewing && <FileViewer file={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
