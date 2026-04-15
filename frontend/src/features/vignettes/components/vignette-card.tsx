import { useState } from 'react'
import { BookOpen, Eye, Pencil, Trash2, Calendar, Check, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils/date'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import type { Vignette } from '@/types/api'

interface VignetteCardProps {
  vignette: Vignette
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onUpdateDate: (date: string) => void
}

export function VignetteCard({ vignette, onView, onEdit, onDelete, onUpdateDate }: VignetteCardProps) {
  const { user } = useAuthStore()
  const isAdmin = user?.is_admin ?? false
  const [editingDate, setEditingDate] = useState(false)
  const [dateValue, setDateValue] = useState(vignette.created_at.split('T')[0])

  const handleSaveDate = () => {
    onUpdateDate(new Date(dateValue).toISOString())
    setEditingDate(false)
  }

  const preview = vignette.content
    ? vignette.content.substring(0, 150) + (vignette.content.length > 150 ? '...' : '')
    : ''

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-2 text-blue-600">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">{vignette.title}</p>
            {preview && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{preview}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              {editingDate ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="date"
                    value={dateValue}
                    onChange={(e) => setDateValue(e.target.value)}
                    className="h-7 text-xs w-36"
                  />
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSaveDate} aria-label="Save date">
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingDate(false)} aria-label="Cancel date edit">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(vignette.created_at)}
                  {isAdmin && (
                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-1" onClick={() => setEditingDate(true)} aria-label="Edit date">
                      <Pencil className="h-2.5 w-2.5" />
                    </Button>
                  )}
                </span>
              )}
            </div>
            {vignette.photos.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                📷 {vignette.photos.length} photo{vignette.photos.length > 1 ? 's' : ''} attached
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onView} aria-label="View vignette">
              <Eye className="h-3.5 w-3.5" />
            </Button>
            {isAdmin && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit} aria-label="Edit vignette">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete} aria-label="Delete vignette">
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
