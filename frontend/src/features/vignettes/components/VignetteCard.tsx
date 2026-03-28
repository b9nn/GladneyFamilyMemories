import { useRef, useState } from 'react';
import { generateHTML } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import type { Vignette } from '@/types/api';
import { formatDate } from '@/lib/utils/date';

interface VignetteCardProps {
  vignette: Vignette;
  isAdmin: boolean;
  onEdit: (v: Vignette) => void;
  onDelete: (id: number) => void;
  onRename: (id: number, title: string) => void;
}

function renderContent(content: string | null): string {
  if (!content) return '';
  try {
    const json = JSON.parse(content) as object;
    return generateHTML(json, [StarterKit, Underline, Link]);
  } catch {
    return content;
  }
}

export function VignetteCard({ vignette, isAdmin, onEdit, onDelete, onRename }: VignetteCardProps) {
  const html = renderContent(vignette.content);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(vignette.title);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setTitle(vignette.title);
    setEditingTitle(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commitRename() {
    const trimmed = title.trim();
    if (trimmed && trimmed !== vignette.title) {
      onRename(vignette.id, trimmed);
    } else {
      setTitle(vignette.title);
    }
    setEditingTitle(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') { setTitle(vignette.title); setEditingTitle(false); }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-3">
      <div className="flex items-start justify-between gap-3">
        {isAdmin && editingTitle ? (
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            className="flex-1 text-lg font-semibold bg-transparent border-b border-primary text-foreground focus:outline-none leading-tight"
          />
        ) : (
          <h3
            className={`text-lg font-semibold text-foreground leading-tight ${isAdmin ? 'cursor-text hover:text-primary transition-colors' : ''}`}
            title={isAdmin ? 'Click to rename' : undefined}
            onClick={isAdmin ? startEdit : undefined}
          >
            {vignette.title}
          </h3>
        )}
        {isAdmin && (
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => onEdit(vignette)} className="text-sm text-muted-foreground hover:text-foreground">Edit</button>
            <button onClick={() => onDelete(vignette.id)} className="text-sm text-muted-foreground hover:text-destructive">Delete</button>
          </div>
        )}
      </div>
      {html && (
        <div
          className="prose prose-sm dark:prose-invert max-w-none line-clamp-6 text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
      <p className="text-xs text-muted-foreground">{formatDate(vignette.created_at)}</p>
    </div>
  );
}
