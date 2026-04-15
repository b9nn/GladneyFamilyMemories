import { useState } from 'react'
import { Download, Eye, Pencil, Trash2, Check, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/utils/date'
import { TagInput } from '@/features/search/components/tag-input'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import type { FileItem } from '@/types/api'

interface FileCardProps {
  file: FileItem
  onView: () => void
  onDownload: () => void
  onUpdate: (title: string, description: string) => void
  onDelete: () => void
}

function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️'
  if (['mp4', 'webm', 'mov'].includes(ext)) return '🎬'
  if (['mp3', 'wav', 'ogg', 'webm'].includes(ext)) return '🎵'
  if (ext === 'pdf') return '📄'
  if (['doc', 'docx'].includes(ext)) return '📝'
  if (['xls', 'xlsx'].includes(ext)) return '📊'
  return '📎'
}

function isViewable(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'webm', 'mov', 'mp3', 'wav', 'ogg', 'pdf', 'txt', 'md', 'csv', 'json'].includes(ext)
}

export function FileCard({ file, onView, onDownload, onUpdate, onDelete }: FileCardProps) {
  const { user } = useAuthStore()
  const isAdmin = user?.is_admin ?? false
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(file.title || '')
  const [editDesc, setEditDesc] = useState(file.description || '')

  const handleSave = () => {
    onUpdate(editTitle, editDesc)
    setEditing(false)
  }

  if (editing) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Title"
          />
          <Textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            placeholder="Description"
            rows={2}
          />
          <TagInput contentType="file" contentId={file.id} />
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
    <Card className="group">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{getFileIcon(file.filename)}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{file.title || file.filename}</p>
            {file.description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{file.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{formatDate(file.created_at)}</p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isViewable(file.filename) && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onView} aria-label="View file">
                <Eye className="h-3.5 w-3.5" />
              </Button>
            )}
            {isAdmin && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDownload} aria-label="Download file">
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(true)} aria-label="Edit file">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete} aria-label="Delete file">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
