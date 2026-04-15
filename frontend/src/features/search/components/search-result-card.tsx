import { useNavigate } from 'react-router-dom'
import { BookOpen, Camera, Mic, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/date'
import type { SearchResult } from '@/types/api'

const typeConfig = {
  vignette: { icon: BookOpen, label: 'Vignette', route: '/vignettes' },
  photo: { icon: Camera, label: 'Photo', route: '/photos' },
  audio: { icon: Mic, label: 'Audio', route: '/audio' },
  file: { icon: FileText, label: 'File', route: '/files' },
}

interface SearchResultCardProps {
  result: SearchResult
}

export function SearchResultCard({ result }: SearchResultCardProps) {
  const navigate = useNavigate()
  const config = typeConfig[result.content_type]
  const Icon = config.icon

  return (
    <button
      onClick={() => navigate(config.route)}
      className="w-full text-left rounded-lg border bg-card p-4 hover:shadow-md transition-shadow space-y-2"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm flex-1 truncate">{result.title}</span>
        <Badge variant="secondary" className="text-xs">{config.label}</Badge>
        <span className="text-xs text-muted-foreground">{formatDate(result.created_at)}</span>
      </div>
      {result.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{result.description}</p>
      )}
      {result.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {result.tags.map((tag) => (
            <Badge key={tag.id} variant="outline" className="text-xs">{tag.name}</Badge>
          ))}
        </div>
      )}
    </button>
  )
}
