import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { useSearch } from './hooks/useSearch';
import { formatDate } from '@/lib/utils/date';

const TYPE_ICONS: Record<string, string> = {
  vignette: '📖',
  photo: '📷',
  audio: '🎙',
  file: '📄',
};

const TYPE_PATHS: Record<string, string> = {
  vignette: '/vignettes',
  photo: '/photos',
  audio: '/audio',
  file: '/files',
};

export function SearchPage() {
  const [query, setQuery] = useState('');
  const { data: results, isLoading, isFetching } = useSearch(query);

  const hasQuery = query.trim().length >= 2;

  return (
    <div>
      <PageHeader title="Search" description="Search across all family content" />

      <div className="mb-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search vignettes, photos, audio, files…"
          autoFocus
          className="w-full max-w-xl rounded-md border border-input bg-background px-4 py-3 text-base text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {!hasQuery && (
        <p className="text-muted-foreground text-sm">Type at least 2 characters to search.</p>
      )}

      {hasQuery && (isLoading || isFetching) && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg border border-border bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {hasQuery && !isLoading && !isFetching && results && (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {results.length === 0 ? 'No results' : `${results.length} result${results.length !== 1 ? 's' : ''}`} for "{query}"
          </p>
          <div className="space-y-2">
            {results.map((result) => (
              <Link
                key={`${result.content_type}-${result.id}`}
                to={TYPE_PATHS[result.content_type] ?? '/'}
                className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 hover:bg-accent transition-colors"
              >
                <span className="text-xl flex-shrink-0 mt-0.5">
                  {TYPE_ICONS[result.content_type] ?? '📄'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                  {result.snippet && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{result.snippet}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {result.content_type} · {formatDate(result.created_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
