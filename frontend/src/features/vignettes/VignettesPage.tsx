import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { VignetteCard } from './components/VignetteCard';
import { VignetteForm } from './components/VignetteForm';
import { useVignettes, useCreateVignette, useUpdateVignette, useDeleteVignette } from './hooks/useVignettes';
import { useIsAdmin } from '@/lib/utils/useIsAdmin';
import type { Vignette } from '@/types/api';

type Mode = 'list' | 'create' | 'edit';

export function VignettesPage() {
  const { data: vignettes, isLoading } = useVignettes();
  const create = useCreateVignette();
  const update = useUpdateVignette();
  const remove = useDeleteVignette();
  const isAdmin = useIsAdmin();

  const [mode, setMode] = useState<Mode>('list');
  const [editing, setEditing] = useState<Vignette | null>(null);

  function handleEdit(v: Vignette) { setEditing(v); setMode('edit'); }
  function handleDelete(id: number) { if (!confirm('Delete this vignette?')) return; remove.mutate(id); }
  function handleRename(id: number, title: string) { update.mutate({ id, data: { title } }); }
  async function handleCreate(title: string, content: string) { const v = await create.mutateAsync({ title, content }); setMode('list'); return v; }
  async function handleUpdate(title: string, content: string) {
    if (!editing) return editing!;
    const v = await update.mutateAsync({ id: editing.id, data: { title, content } });
    setMode('list'); setEditing(null); return v;
  }

  if (mode === 'create') return (
    <div><PageHeader title="New Vignette" />
      <VignetteForm onSave={handleCreate} onCancel={() => setMode('list')} /></div>
  );

  if (mode === 'edit' && editing) return (
    <div><PageHeader title="Edit Vignette" />
      <VignetteForm initial={editing} onSave={handleUpdate} onCancel={() => { setMode('list'); setEditing(null); }} /></div>
  );

  return (
    <div>
      <PageHeader
        title="Vignettes"
        description="Family stories and memories"
        action={isAdmin ? (
          <button onClick={() => setMode('create')} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
            New vignette
          </button>
        ) : undefined}
      />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-40 rounded-lg border border-border bg-muted animate-pulse" />)}
        </div>
      ) : !vignettes?.length ? (
        <EmptyState
          title="No vignettes yet"
          description="Start capturing your family memories by creating your first vignette."
          action={isAdmin ? (
            <button onClick={() => setMode('create')} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
              New vignette
            </button>
          ) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {vignettes.map((v) => (
            <VignetteCard key={v.id} vignette={v} isAdmin={isAdmin}
              onEdit={handleEdit} onRename={handleRename} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
