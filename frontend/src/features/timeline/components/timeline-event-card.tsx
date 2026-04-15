import { useNavigate } from 'react-router-dom'
import { BookOpen, Camera, Mic, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AuthenticatedImage } from '@/components/shared/authenticated-image'
import { formatDate } from '@/lib/utils/date'
import type { TimelineEvent } from '../types'

const typeConfig = {
  vignette: { icon: BookOpen, label: 'Vignette', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  photo: { icon: Camera, label: 'Photo', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  audio: { icon: Mic, label: 'Audio', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  file: { icon: FileText, label: 'File', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
}

const typeRoutes = {
  vignette: '/vignettes',
  photo: '/photos',
  audio: '/audio',
  file: '/files',
}

interface TimelineEventCardProps {
  event: TimelineEvent
}

export function TimelineEventCard({ event }: TimelineEventCardProps) {
  const navigate = useNavigate()
  const config = typeConfig[event.contentType]
  const Icon = config.icon

  return (
    <button
      onClick={() => navigate(typeRoutes[event.contentType])}
      className="w-full text-left rounded-lg border bg-card p-4 hover:shadow-md transition-shadow flex gap-4 items-start"
    >
      {/* Photo thumbnail */}
      {event.photoId && (
        <div className="shrink-0 h-16 w-16 rounded-md overflow-hidden bg-muted">
          <AuthenticatedImage
            photoId={event.photoId}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={config.color}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatDate(event.date)}</span>
        </div>
        <p className="font-medium text-sm truncate">{event.title}</p>
        {event.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
        )}
      </div>
    </button>
  )
}
