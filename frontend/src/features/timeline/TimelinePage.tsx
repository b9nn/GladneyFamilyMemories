import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { useTimeline } from './hooks/useTimeline';
import { formatDate } from '@/lib/utils/date';

const FILTER_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Vignettes', value: 'vignette' },
  { label: 'Photos', value: 'photo' },
  { label: 'Audio', value: 'audio' },
  { label: 'Files', value: 'file' },
];

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

export function TimelinePage() {
  const [filter, setFilter] = useState('');
  const { data: items, isLoading } = useTimeline(filter || undefined);

  return (
    <div>
      <PageHeader title="Timeline" description="Family history in chronological order" />

      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="max-w-md space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg border border-border bg-muted animate-pulse" />
          ))}
        </div>
      ) : !items?.length ? (
        <EmptyState title="Nothing here yet" description="Content you add will appear in the timeline." />
      ) : (
        <div className="relative max-w-md">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-6 pl-12">
            {items.map((item) => (
              <div key={`${item.content_type}-${item.id}`} className="relative">
                <div className="absolute -left-[2.35rem] flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border text-sm">
                  {TYPE_ICONS[item.content_type] ?? '📄'}
                </div>
                <Link
                  to={TYPE_PATHS[item.content_type] ?? '/'}
                  className="block rounded-lg border border-border bg-card p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {item.thumbnail_url && (
                      <img
                        src={item.thumbnail_url}
                        alt=""
                        className="w-16 h-16 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.content_type} · {formatDate(item.created_at)}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
