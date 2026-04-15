import { useState, useRef } from 'react'
import { Mic, Upload } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Recorder } from './components/recorder'
import { RecordingCard } from './components/recording-card'
import { useRecordings, useUploadRecording, useUpdateRecording, useDeleteRecording } from './hooks/use-recordings'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import type { AudioRecording } from '@/types/api'

export function AudioPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.is_admin ?? false
  const { data: recordings, isLoading } = useRecordings()
  const uploadRecording = useUploadRecording()
  const updateRecording = useUpdateRecording()
  const deleteRecording = useDeleteRecording()

  const [currentPlaying, setCurrentPlaying] = useState<number | null>(null)
  const [deletingRecording, setDeletingRecording] = useState<AudioRecording | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadRecording.mutateAsync({ file, title: file.name })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div>
      <PageHeader
        title="Audio Recordings"
        description="Voice recordings and memories"
        actions={
          isAdmin ? (
            <>
              <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" /> Upload Audio
              </Button>
            </>
          ) : undefined
        }
      />

      {isAdmin && (
        <div className="mb-6">
          <Recorder />
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : !recordings?.length ? (
        <EmptyState
          icon={Mic}
          title="No recordings yet"
          description={isAdmin ? "Record or upload audio to get started." : "No recordings have been shared yet."}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recordings.map((recording) => (
            <RecordingCard
              key={recording.id}
              recording={recording}
              isPlaying={currentPlaying === recording.id}
              onPlay={() => setCurrentPlaying(recording.id)}
              onPause={() => setCurrentPlaying(null)}
              onUpdate={(title, description) =>
                updateRecording.mutate({ id: recording.id, updates: { title, description } })
              }
              onDelete={() => setDeletingRecording(recording)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deletingRecording}
        onOpenChange={() => setDeletingRecording(null)}
        title="Delete Recording"
        description={`Delete "${deletingRecording?.title || deletingRecording?.filename}"? This cannot be undone.`}
        confirmLabel="Delete" destructive
        onConfirm={() => { if (deletingRecording) deleteRecording.mutate(deletingRecording.id) }}
      />
    </div>
  )
}

export default AudioPage
