import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/shared/toast'
import { useContentTags, useTags, useAddTag, useRemoveTag, useCreateTag } from '../hooks/use-search'

interface TagInputProps {
  contentType: string
  contentId: number
}

export function TagInput({ contentType, contentId }: TagInputProps) {
  const { toast } = useToast()
  const { data: contentTags = [] } = useContentTags(contentType, contentId)
  const { data: allTags = [] } = useTags()
  const addTag = useAddTag()
  const removeTag = useRemoveTag()
  const createTag = useCreateTag()

  const [showInput, setShowInput] = useState(false)
  const [query, setQuery] = useState('')

  const availableTags = allTags.filter(
    (t) => !contentTags.some((ct) => ct.id === t.id) && t.name.toLowerCase().includes(query.toLowerCase())
  )

  const handleAdd = async (tagId: number) => {
    try {
      await addTag.mutateAsync({ contentType, contentId, tagId })
    } catch {
      toast('Failed to add tag', 'error')
    }
    setQuery('')
    setShowInput(false)
  }

  const handleRemove = async (tagId: number) => {
    try {
      await removeTag.mutateAsync({ contentType, contentId, tagId })
    } catch {
      toast('Failed to remove tag', 'error')
    }
  }

  const handleCreate = async () => {
    if (!query.trim()) return
    try {
      const tag = await createTag.mutateAsync({ name: query.trim() })
      await addTag.mutateAsync({ contentType, contentId, tagId: tag.id })
      setQuery('')
      setShowInput(false)
    } catch {
      toast('Failed to create tag', 'error')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 items-center">
        {contentTags.map((tag) => (
          <Badge key={tag.id} variant="secondary" className="gap-1 pr-1">
            {tag.name}
            <button onClick={() => handleRemove(tag.id)} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {!showInput && (
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowInput(true)}>
            <Plus className="h-3 w-3" /> Tag
          </Button>
        )}
      </div>

      {showInput && (
        <div className="relative">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or create tag..."
            className="h-7 text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setShowInput(false); setQuery('') }
              if (e.key === 'Enter' && query.trim() && availableTags.length === 0) handleCreate()
            }}
          />
          {query && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-md max-h-32 overflow-y-auto">
              {availableTags.slice(0, 5).map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleAdd(tag.id)}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent"
                >
                  {tag.name}
                </button>
              ))}
              {availableTags.length === 0 && query.trim() && (
                <button onClick={handleCreate} className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent text-primary">
                  Create &quot;{query.trim()}&quot;
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
