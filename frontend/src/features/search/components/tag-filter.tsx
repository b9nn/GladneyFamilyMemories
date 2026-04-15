import { Tag as TagIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useTags } from '../hooks/use-search'

interface TagFilterProps {
  selectedTagIds: number[]
  onChange: (tagIds: number[]) => void
}

export function TagFilter({ selectedTagIds, onChange }: TagFilterProps) {
  const { data: tags = [] } = useTags()

  if (tags.length === 0) return null

  const toggle = (tagId: number) => {
    onChange(
      selectedTagIds.includes(tagId)
        ? selectedTagIds.filter((id) => id !== tagId)
        : [...selectedTagIds, tagId]
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
      {tags.map((tag) => (
        <Badge
          key={tag.id}
          variant={selectedTagIds.includes(tag.id) ? 'default' : 'outline'}
          className="cursor-pointer text-xs"
          onClick={() => toggle(tag.id)}
        >
          {tag.name}
        </Badge>
      ))}
    </div>
  )
}
