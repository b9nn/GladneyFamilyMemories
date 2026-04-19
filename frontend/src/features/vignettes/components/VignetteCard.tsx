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

// ── Reading modal ─────────────────────────────────────────────────────────────

function VignetteModal({ vignette, onClose }: { vignette: Vignette; onClose: () => void }) {
  const html = renderContent(vignette.content);

  // Close on Escape
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="relative w-full max-w-2xl my-8 rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-8 pt-8 pb-4">
          <h2 className="text-2xl font-bold text-foreground leading-snug">{vignette.title}</h2>
          <button
            onClick={onClose}
            className="flex-shrink-0 mt-1 flex items-center gap-1.5 rounded-md bg-muted hover:bg-accent px-3 py-1.5 text-sm font-medium text-foreground transition-colors"
          >
            ✕ Close
          </button>
        </div>

        <p className="px-8 pb-4 text-xs text-muted-foreground">{formatDate(vignette.created_at)}</p>

        <hr className="border-border mx-8" />

        {/* Body */}
        <div className="px-8 py-6">
          {html ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="text-muted-foreground italic">No content yet.</p>
          )}
        </div>

        {/* Photos */}
        {vignette.photos?.length > 0 && (
          <div className="px-8 pb-8 flex flex-wrap gap-3">
            {vignette.photos.map((vp) => vp.url && (
              <img
                key={vp.id}
                src={vp.url}
                alt=""
                className="h-40 w-auto max-w-full rounded-md object-cover border border-border cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(vp.url!, '_blank')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

export function VignetteCard({ vignette, isAdmin, onEdit, onDelete, onRename }: VignetteCardProps) {
  const html = renderContent(vignette.content);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(vignette.title);
  const [showModal, setShowModal] = useState(false);
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
    <>
      <div
        className="rounded-lg border border-border bg-card p-6 space-y-3 cursor-pointer hover:border-primary/60 hover:shadow-md transition-all"
        onClick={() => !editingTitle && setShowModal(true)}
      >
        <div className="flex items-start justify-between gap-3">
          {isAdmin && editingTitle ? (
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 text-lg font-semibold bg-transparent border-b border-primary text-foreground focus:outline-none leading-tight"
            />
          ) : (
            <h3
              className={`text-lg font-semibold text-green-400 leading-tight ${isAdmin ? 'cursor-text hover:text-green-300 transition-colors' : ''}`}
              title={isAdmin ? 'Click to rename' : undefined}
              onClick={isAdmin ? (e) => { e.stopPropagation(); startEdit(); } : undefined}
            >
              {vignette.title}
            </h3>
          )}
          {isAdmin && (
            <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
        {vignette.photos?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {vignette.photos.slice(0, 4).map((vp) => vp.url && (
              <img key={vp.id} src={vp.url} alt="" className="h-14 w-14 rounded object-cover border border-border" />
            ))}
            {vignette.photos.length > 4 && (
              <div className="h-14 w-14 rounded border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                +{vignette.photos.length - 4}
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground">{formatDate(vignette.created_at)}</p>
      </div>

      {showModal && (
        <VignetteModal vignette={vignette} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
