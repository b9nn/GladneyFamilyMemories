import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { AudioRecorder } from './components/AudioRecorder';
import { AudioUpload } from './components/AudioUpload';
import { useAudioList, useDeleteAudio, useUpdateAudio } from './hooks/useAudio';
import { formatDate } from '@/lib/utils/date';
import { useIsAdmin } from '@/lib/utils/useIsAdmin';
import type { AudioRecording } from '@/types/api';
import { useQueryClient } from '@tanstack/react-query';

type Panel = 'none' | 'record' | 'upload';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function AudioPage() {
  const qc = useQueryClient();
  const { data: recordings, isLoading } = useAudioList();
  const deleteAudio = useDeleteAudio();
  const updateAudio = useUpdateAudio();
  const isAdmin = useIsAdmin();
  const [panel, setPanel] = useState<Panel>('none');
  const [editing, setEditing] = useState<AudioRecording | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [audioErrors, setAudioErrors] = useState<Set<number>>(new Set());

  function handleDelete(id: number) {
    if (!confirm('Delete this recording?')) return;
    deleteAudio.mutate(id);
  }

  function openEdit(rec: AudioRecording) {
    setEditing(rec);
    setEditTitle(rec.title ?? rec.filename);
  }

  function handleSaveEdit() {
    if (!editing) return;
    updateAudio.mutate(
      { id: editing.id, title: editTitle.trim() || editing.filename },
      { onSuccess: () => setEditing(null) }
    );
  }

  return (
    <div>
      <PageHeader
        title="Audio"
        description="Voice recordings and audio memories"
        action={isAdmin ? (
          <div className="flex gap-2">
            <button
              onClick={() => setPanel(panel === 'record' ? 'none' : 'record')}
              className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
            >
              {panel === 'record' ? 'Cancel' : 'Record'}
            </button>
            <button
              onClick={() => setPanel(panel === 'upload' ? 'none' : 'upload')}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              {panel === 'upload' ? 'Cancel' : 'Upload file'}
            </button>
          </div>
        ) : undefined}
      />

      {panel === 'record' && (
        <div className="mb-8 rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Record audio</h2>
          <AudioRecorder onDone={() => setPanel('none')} />
        </div>
      )}

      {panel === 'upload' && (
        <div className="mb-8 rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Upload audio file</h2>
          <AudioUpload onDone={() => setPanel('none')} />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg border border-border bg-muted animate-pulse" />
          ))}
        </div>
      ) : !recordings?.length ? (
        <EmptyState
          title="No recordings yet"
          description="Record a voice memory or upload an audio file."
          action={isAdmin ? (
            <button
              onClick={() => setPanel('record')}
              className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
            >
              Start recording
            </button>
          ) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {recordings.map((rec) => (
            <div key={rec.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-yellow-400 text-sm">{rec.title ?? rec.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(rec.created_at)}
                    {rec.duration_seconds ? ` · ${formatDuration(rec.duration_seconds)}` : ''}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex gap-3 flex-shrink-0">
                    <button
                      onClick={() => openEdit(rec)}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rec.id)}
                      className="text-sm text-muted-foreground hover:text-destructive"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              {rec.url && (
                <div className="space-y-1">
                  <audio
                    key={rec.url}
                    src={rec.url}
                    controls
                    className="w-full"
                    onError={() => setAudioErrors((prev) => new Set(prev).add(rec.id))}
                    onPlay={() => setAudioErrors((prev) => { const s = new Set(prev); s.delete(rec.id); return s; })}
                  />
                  {audioErrors.has(rec.id) && (
                    <div className="flex items-center gap-3 text-xs text-destructive">
                      <span>Could not load audio.</span>
                      <button
                        onClick={() => { setAudioErrors((prev) => { const s = new Set(prev); s.delete(rec.id); return s; }); qc.invalidateQueries({ queryKey: ['audio'] }); }}
                        className="underline hover:no-underline"
                      >
                        Reload
                      </button>
                      <a href={rec.url} download className="underline hover:no-underline text-muted-foreground">
                        Download instead
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-foreground">Edit title</h2>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditing(null); }}
                autoFocus
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveEdit}
                disabled={updateAudio.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {updateAudio.isPending ? 'Saving…' : 'Save'}
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
