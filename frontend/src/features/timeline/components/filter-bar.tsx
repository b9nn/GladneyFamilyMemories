import { BookOpen, Camera, Mic, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TagFilter } from '@/features/search/components/tag-filter'
import type { ContentType, TimelineFilters } from '../types'
import { defaultFilters } from '../types'

interface FilterBarProps {
  filters: TimelineFilters
  onChange: (filters: TimelineFilters) => void
}

const typeButtons: { type: ContentType; label: string; icon: typeof BookOpen }[] = [
  { type: 'vignette', label: 'Vignettes', icon: BookOpen },
  { type: 'photo', label: 'Photos', icon: Camera },
  { type: 'audio', label: 'Audio', icon: Mic },
  { type: 'file', label: 'Files', icon: FileText },
]

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const toggleType = (type: ContentType) => {
    const types = filters.contentTypes.includes(type)
      ? filters.contentTypes.filter((t) => t !== type)
      : [...filters.contentTypes, type]
    onChange({ ...filters, contentTypes: types })
  }

  const hasFilters =
    filters.contentTypes.length < 4 || filters.dateFrom || filters.dateTo || filters.tagIds.length > 0

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          {typeButtons.map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              variant={filters.contentTypes.includes(type) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleType(type)}
              className="gap-1.5"
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
            className="h-8 w-full sm:w-36 text-xs"
            placeholder="From"
            aria-label="Filter from date"
          />
          <span className="text-muted-foreground text-xs">to</span>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
            className="h-8 w-full sm:w-36 text-xs"
            placeholder="To"
            aria-label="Filter to date"
          />
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => onChange(defaultFilters)}>
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      <TagFilter
        selectedTagIds={filters.tagIds}
        onChange={(tagIds) => onChange({ ...filters, tagIds })}
      />
    </div>
  )
}
