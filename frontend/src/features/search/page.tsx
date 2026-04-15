import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SearchResultCard } from './components/search-result-card'
import { useSearch } from './hooks/use-search'
import type { SearchResult } from '@/types/api'

const typeFilters = [
  { value: undefined as string | undefined, label: 'All' },
  { value: 'vignette', label: 'Vignettes' },
  { value: 'photo', label: 'Photos' },
  { value: 'audio', label: 'Audio' },
  { value: 'file', label: 'Files' },
]

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [typeFilter, setTypeFilter] = useState<string | undefined>(params.get('type') || undefined)
  const { data: results, isLoading } = useSearch(query, typeFilter)

  const handleSearch = (q: string) => {
    setQuery(q)
    setParams(q ? { q, ...(typeFilter ? { type: typeFilter } : {}) } : {})
  }

  return (
    <div>
      <PageHeader title="Search" description="Find memories across all content" />

      <div className="space-y-4">
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search vignettes, photos, audio, files..."
          className="max-w-lg"
          autoFocus
        />

        <div className="flex gap-1">
          {typeFilters.map((f) => (
            <Button
              key={f.label}
              variant={typeFilter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setTypeFilter(f.value)
                if (query) setParams({ q: query, ...(f.value ? { type: f.value } : {}) })
              }}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {query.length < 2 ? (
          <EmptyState
            icon={SearchIcon}
            title="Start searching"
            description="Type at least 2 characters to search across all memories."
          />
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : !results?.length ? (
          <EmptyState
            icon={SearchIcon}
            title="No results"
            description={`No matches found for "${query}".`}
          />
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{results.length} result{results.length !== 1 ? 's' : ''}</p>
            {results.map((r: SearchResult) => (
              <SearchResultCard key={`${r.content_type}-${r.content_id}`} result={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchPage
