import { useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AuthenticatedAudio } from '@/components/shared/authenticated-audio'
import { formatDate } from '@/lib/utils/date'
import { TagInput } from '@/features/search/components/tag-input'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import type { AudioRecording } from '@/types/api'

interface RecordingCardProps {
  recording: AudioRecording
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onUpdate: (title: string, description: string) => void
  onDelete: () => void
}

export function RecordingCard({ recording, isPlaying, onPlay, onPause, onUpdate, onDelete }: RecordingCardProps) {
  const { user } = useAuthStore()
  const isAdmin = user?.is_admin ?? false
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(recording.title || '')
  const [editDesc, setEditDesc] = useState(recording.description || '')

  const handleSave = () => {
    onUpdate(editTitle, editDesc)
    setEditing(false)
  }

  if (editing) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1">
            <Label>Tags</Label>
            <TagInput contentType="audio" contentId={recording.id} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              <Check className="h-3 w-3" /> Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
              <X className="h-3 w-3" /> Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={isPlaying ? 'ring-2 ring-primary/20' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-medium">{recording.title || recording.filename}</p>
            <p className="text-xs text-muted-foreground">{formatDate(recording.created_at)}</p>
            {recording.description && (
              <p className="text-sm text-muted-foreground mt-1">{recording.description}</p>
            )}
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(true)} aria-label="Edit recording">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete} aria-label="Delete recording">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
        <AuthenticatedAudio
          audioId={recording.id}
          onPlay={onPlay}
          onPause={onPause}
          className="w-full"
        />
      </CardContent>
    </Card>
  )
}
