import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { VignetteCard } from './components/VignetteCard';
import { VignetteForm } from './components/VignetteForm';
import { useVignettes, useCreateVignette, useUpdateVignette, useDeleteVignette, useReorderVignettes } from './hooks/useVignettes';
import { useIsAdmin } from '@/lib/utils/useIsAdmin';
import type { Vignette } from '@/types/api';

type Mode = 'list' | 'create' | 'edit';

export function VignettesPage() {
  const { data: vignettes, isLoading } = useVignettes();
  const create = useCreateVignette();
  const update = useUpdateVignette();
  const remove = useDeleteVignette();
  const reorder = useReorderVignettes();
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
        <DragDropContext onDragEnd={(result: DropResult) => {
          if (!result.destination || result.destination.index === result.source.index || !isAdmin) return;
          const reordered = Array.from(vignettes!);
          const [moved] = reordered.splice(result.source.index, 1);
          reordered.splice(result.destination.index, 0, moved);
          reorder.mutate(reordered.map((v, i) => ({ id: v.id, sort_order: i })));
        }}>
          <Droppable droppableId="vignettes" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
              >
                {vignettes!.map((v, index) => (
                  <Draggable key={v.id} draggableId={String(v.id)} index={index} isDragDisabled={!isAdmin}>
                    {(drag, snapshot) => (
                      <div
                        ref={drag.innerRef}
                        {...drag.draggableProps}
                        {...drag.dragHandleProps}
                        className={snapshot.isDragging ? 'opacity-75 ring-2 ring-primary rounded-lg' : ''}
                      >
                        <VignetteCard vignette={v} isAdmin={isAdmin}
                          onEdit={handleEdit} onRename={handleRename} onDelete={handleDelete} />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
