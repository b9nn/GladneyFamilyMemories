import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Camera, Mic, FileText, Home, TreePine, Clock, Shield } from 'lucide-react'
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator,
} from '@/components/ui/command'
import { useSearch } from '../hooks/use-search'

const pages = [
  { name: 'Home', icon: Home, path: '/' },
  { name: 'Vignettes', icon: BookOpen, path: '/vignettes' },
  { name: 'Photos', icon: Camera, path: '/photos' },
  { name: 'Audio', icon: Mic, path: '/audio' },
  { name: 'Files', icon: FileText, path: '/files' },
  { name: 'Family Tree', icon: TreePine, path: '/family-tree' },
  { name: 'Timeline', icon: Clock, path: '/timeline' },
  { name: 'Admin', icon: Shield, path: '/admin' },
]

const typeIcons = { vignette: BookOpen, photo: Camera, audio: Mic, file: FileText }
const typeRoutes = { vignette: '/vignettes', photo: '/photos', audio: '/audio', file: '/files' }

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const { data: results } = useSearch(query)

  const handleOpenChange = useCallback((value: boolean) => {
    if (!value) setQuery('')
    onOpenChange(value)
  }, [onOpenChange])

  const go = useCallback((path: string) => {
    navigate(path)
    handleOpenChange(false)
  }, [navigate, handleOpenChange])

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange} title="Search" description="Search memories or navigate pages">
      <CommandInput placeholder="Search memories..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {results && results.length > 0 && (
          <CommandGroup heading="Search Results">
            {results.slice(0, 10).map((r) => {
              const Icon = typeIcons[r.content_type]
              return (
                <CommandItem
                  key={`${r.content_type}-${r.content_id}`}
                  onSelect={() => go(typeRoutes[r.content_type])}
                >
                  <Icon className="h-4 w-4 mr-2 shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate">{r.title}</p>
                    {r.description && (
                      <p className="text-xs text-muted-foreground truncate">{r.description}</p>
                    )}
                  </div>
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Pages">
          {pages.map(({ name, icon: Icon, path }) => (
            <CommandItem key={path} onSelect={() => go(path)}>
              <Icon className="h-4 w-4 mr-2" />
              {name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
