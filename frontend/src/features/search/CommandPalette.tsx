import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/lib/api/search';
import { FileText, Image, Music, File as FileIcon, User } from 'lucide-react';
import type { SearchResult } from '@/types/api';

const ROUTE_FOR_TYPE: Record<string, string> = {
  vignette: '/vignettes',
  photo: '/photos',
  audio: '/audio',
  file: '/files',
  family_member: '/family-tree',
};

const ICON_FOR_TYPE: Record<string, typeof FileText> = {
  vignette: FileText,
  photo: Image,
  audio: Music,
  file: FileIcon,
  family_member: User,
};

const TYPE_LABEL: Record<string, string> = {
  vignette: 'Vignettes',
  photo: 'Photos',
  audio: 'Audio',
  file: 'Files',
  family_member: 'Family',
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const openRef = useRef(false);

  useEffect(() => { openRef.current = open; }, [open]);

  // Stable listener — uses ref to avoid re-registration on every toggle.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape' && openRef.current) {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => { if (!open) setQuery(''); }, [open]);

  const { data: results = [], isFetching, isError } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchApi.search(query),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.content_type] ||= []).push(r);
    return acc;
  }, {});

  function go(r: SearchResult) {
    setOpen(false);
    navigate(ROUTE_FOR_TYPE[r.content_type] ?? '/');
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global search"
      shouldFilter={false}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-black/50"
      overlayClassName="fixed inset-0 bg-black/50"
      contentClassName="w-full max-w-xl rounded-lg border border-border bg-popover shadow-2xl overflow-hidden mx-4"
    >
      <Command.Input
        value={query}
        onValueChange={setQuery}
        placeholder="Search vignettes, photos, family members…"
        className="w-full px-4 py-3 text-sm bg-transparent text-foreground border-b border-border focus:outline-none placeholder:text-muted-foreground"
      />
      <Command.List className="max-h-[400px] overflow-y-auto p-2">
        {query.trim().length < 2 && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            Type at least 2 characters to search.
          </p>
        )}
        {query.trim().length >= 2 && isFetching && results.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">Searching…</p>
        )}
        {query.trim().length >= 2 && isError && (
          <p className="px-3 py-6 text-center text-xs text-destructive">Search failed. Try again.</p>
        )}
        {query.trim().length >= 2 && !isFetching && !isError && results.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">No results.</p>
        )}
        {Object.entries(grouped).map(([type, items]) => {
          const Icon = ICON_FOR_TYPE[type] ?? FileText;
          return (
            <Command.Group key={type} heading={TYPE_LABEL[type] ?? type} className="text-xs text-muted-foreground px-2 py-1">
              {items.map((r) => (
                <Command.Item
                  key={`${type}-${r.id}`}
                  value={`${type}-${r.id}-${r.title}`}
                  onSelect={() => go(r)}
                  className="flex items-center gap-3 px-3 py-2 rounded text-sm text-foreground cursor-pointer aria-selected:bg-accent"
                >
                  <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{r.title}</p>
                    {r.snippet && <p className="text-xs text-muted-foreground truncate">{r.snippet}</p>}
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          );
        })}
      </Command.List>
      <div className="flex items-center justify-between px-3 py-2 border-t border-border text-xs text-muted-foreground">
        <span>↑↓ navigate · ↵ select</span>
        <span>Esc close</span>
      </div>
    </Command.Dialog>
  );
}
