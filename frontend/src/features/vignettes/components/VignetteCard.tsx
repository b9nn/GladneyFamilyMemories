import { generateHTML } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import type { Vignette } from '@/types/api';
import { formatDate } from '@/lib/utils/date';

interface VignetteCardProps {
  vignette: Vignette;
  onEdit: (v: Vignette) => void;
  onDelete: (id: number) => void;
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

export function VignetteCard({ vignette, onEdit, onDelete }: VignetteCardProps) {
  const html = renderContent(vignette.content);

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground leading-tight">{vignette.title}</h3>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(vignette)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(vignette.id)}
            className="text-sm text-muted-foreground hover:text-destructive"
          >
            Delete
          </button>
        </div>
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
