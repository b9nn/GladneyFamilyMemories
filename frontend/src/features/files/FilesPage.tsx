import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { useFiles, useDeleteFile, useUpdateFile, useReorderFiles } from './hooks/useFiles';
import { filesApi } from '@/lib/api/files';
import { toast } from '@/stores/toast-store';
import { useIsAdmin } from '@/lib/utils/useIsAdmin';
import type { FileRecord } from '@/types/api';

function getFileTypeBadge(type: string | null): string | null {
  if (!type) return null;
  if (type.startsWith('video/')) return 'VIDEO';
  if (type.startsWith('audio/')) return 'AUDIO';
  if (type.startsWith('image/')) return 'IMAGE';
  if (type.includes('pdf')) return 'PDF';
  if (type.includes('word') || type.includes('document')) return 'DOC';
  if (type.includes('sheet') || type.includes('excel')) return 'SHEET';
  if (type.includes('presentation') || type.includes('powerpoint')) return 'SLIDES';
  return null;
}

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
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header bar — always visible */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 bg-gray-900 border-b border-white/10 flex-shrink-0">
        <p className="text-sm font-medium text-white truncate">{file.title ?? file.filename}</p>
        <div className="flex items-center gap-3 flex-shrink-0">
          {url && (
            <a
              href={url}
              download
              className="rounded-md border border-white/30 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-colors"
            >
              Download
            </a>
          )}
          <button
            onClick={onClose}
            className="rounded-md bg-white px-4 py-1.5 text-sm font-bold text-black hover:bg-gray-200 transition-colors"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        {kind === 'office' && (
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
            className="w-full h-full rounded min-h-[80vh]"
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
  const queryClient = useQueryClient();
  const { data: files, isLoading } = useFiles();
  const updateFile = useUpdateFile();
  const deleteFile = useDeleteFile();
  const reorderFiles = useReorderFiles();
  const isAdmin = useIsAdmin();

  function handleDragEnd(result: DropResult) {
    if (!result.destination || !files) return;
    const reordered = Array.from(files);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    reorderFiles.mutate(reordered.map((f, i) => ({ id: f.id, sort_order: i })));
  }
  const fileRef = useRef<HTMLInputElement>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState<FileRecord | null>(null);
  const [editing, setEditing] = useState<FileRecord | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setUploadProgress(0);
    setError('');
    try {
      await filesApi.upload(selectedFile, title || undefined, undefined, 'files', (pct) => setUploadProgress(pct));
      await queryClient.invalidateQueries({ queryKey: ['files'] });
      toast('File uploaded', 'success');
      setSelectedFile(null);
      setTitle('');
      setUploadProgress(0);
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

  function openEdit(file: FileRecord) {
    setEditing(file);
    setEditTitle(file.title ?? '');
    setEditDescription(file.description ?? '');
  }

  function handleSaveEdit() {
    if (!editing) return;
    updateFile.mutate(
      { id: editing.id, payload: { title: editTitle || undefined, description: editDescription || undefined } },
      { onSuccess: () => setEditing(null) }
    );
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
            onClick={() => !uploading && fileRef.current?.click()}
          >
            <p className="text-muted-foreground text-sm">
              {selectedFile ? selectedFile.name : 'Click to select a file'}
            </p>
            {selectedFile && (
              <p className="text-xs text-muted-foreground mt-1">{formatBytes(selectedFile.size)}</p>
            )}
            {!selectedFile && (
              <p className="text-xs text-muted-foreground mt-2">Documents, PDFs, images, video, audio</p>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {uploading && (
            <div className="space-y-1">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">{uploadProgress}%</p>
            </div>
          )}
          {selectedFile && !uploading && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleUpload}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                Upload
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
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="files" isDropDisabled={!isAdmin}>
            {(provided) => (
              <div className="flex flex-col gap-3" ref={provided.innerRef} {...provided.droppableProps}>
                {files.map((file, index) => (
                  <Draggable key={file.id} draggableId={String(file.id)} index={index} isDragDisabled={!isAdmin}>
                    {(drag, snapshot) => (
                      <div
                        ref={drag.innerRef}
                        {...drag.draggableProps}
                        className={`flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-5 py-4 hover:bg-accent/50 transition-colors cursor-pointer ${snapshot.isDragging ? 'opacity-75 ring-2 ring-primary shadow-lg' : ''}`}
                        onClick={() => {
                          if (!file.url) return;
                          const kind = getViewerType(file.file_type);
                          if (kind === 'image' || kind === 'video' || kind === 'audio' || kind === 'office') {
                            setViewing(file);
                          } else {
                            window.open(file.url, '_blank', 'noopener,noreferrer');
                          }
                        }}
                      >
                        {isAdmin && (
                          <div
                            {...drag.dragHandleProps}
                            className="flex-shrink-0 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing px-1 select-none"
                            onClick={(e) => e.stopPropagation()}
                          >
                            ⠿
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-base font-semibold text-yellow-400 truncate">
                              {file.title ?? file.filename}
                            </p>
                            {getFileTypeBadge(file.file_type) && (
                              <span className="flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                                {getFileTypeBadge(file.file_type)}
                              </span>
                            )}
                          </div>
                          {file.description && (
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{file.description}</p>
                          )}
                        </div>
                        <div className="flex gap-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
                            <>
                              <button
                                onClick={() => openEdit(file)}
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(file.id)}
                                className="text-xs text-muted-foreground hover:text-destructive"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

      )}

      {viewing && <FileViewer file={viewing} onClose={() => setViewing(null)} />}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-foreground">Edit file</h2>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Document title…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Optional description…"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveEdit}
                disabled={updateFile.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {updateFile.isPending ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setEditing(null)}
                className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
