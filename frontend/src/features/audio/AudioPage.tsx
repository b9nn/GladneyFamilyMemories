import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { AudioRecorder } from './components/AudioRecorder';
import { AudioUpload } from './components/AudioUpload';
import { useAudioList, useDeleteAudio } from './hooks/useAudio';
import { formatDate } from '@/lib/utils/date';
import { useIsAdmin } from '@/lib/utils/useIsAdmin';

type Panel = 'none' | 'record' | 'upload';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function AudioPage() {
  const { data: recordings, isLoading } = useAudioList();
  const deleteAudio = useDeleteAudio();
  const isAdmin = useIsAdmin();
  const [panel, setPanel] = useState<Panel>('none');

  function handleDelete(id: number) {
    if (!confirm('Delete this recording?')) return;
    deleteAudio.mutate(id);
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
                  <p className="font-medium text-foreground text-sm">{rec.title ?? rec.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(rec.created_at)}
                    {rec.duration_seconds ? ` · ${formatDuration(rec.duration_seconds)}` : ''}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(rec.id)}
                    className="text-sm text-muted-foreground hover:text-destructive flex-shrink-0"
                  >
                    Delete
                  </button>
                )}
              </div>
              {rec.url && (
                <audio src={rec.url} controls className="w-full h-10" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
