import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';
import type { Album } from '@/types/api';

interface AlbumGridProps {
  albums: Album[];
  isAdmin: boolean;
  onSelect: (album: Album) => void;
  onDelete: (id: number) => void;
  onRename?: (id: number, name: string) => void;
  onDropPhoto?: (albumId: number, photoId: number) => void;
  onReorder?: (orderedIds: number[]) => void;
}

export function AlbumGrid({ albums, isAdmin, onSelect, onDelete, onRename, onDropPhoto, onReorder }: AlbumGridProps) {
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [renamingAlbum, setRenamingAlbum] = useState<Album | null>(null);
  const [renameValue, setRenameValue] = useState('');

  function openRename(e: React.MouseEvent, album: Album) {
    e.stopPropagation();
    setRenamingAlbum(album);
    setRenameValue(album.name);
  }

  function saveRename() {
    if (!renamingAlbum || !renameValue.trim()) return;
    onRename?.(renamingAlbum.id, renameValue.trim());
    setRenamingAlbum(null);
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination || result.destination.index === result.source.index) return;
    const reordered = Array.from(albums);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onReorder?.(reordered.map(a => a.id));
  }

  const cards = albums.map((album, index) => (
    <Draggable key={album.id} draggableId={String(album.id)} index={index} isDragDisabled={!isAdmin || !onReorder}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group relative rounded-lg border-2 bg-card overflow-hidden cursor-pointer transition-colors ${
            snapshot.isDragging
              ? 'border-primary shadow-2xl opacity-90'
              : dragOverId === album.id
              ? 'border-primary scale-[1.02] shadow-lg'
              : 'border-border hover:border-primary'
          }`}
          onClick={() => onSelect(album)}
          onDragOver={(e) => { e.preventDefault(); setDragOverId(album.id); }}
          onDragLeave={() => setDragOverId(null)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverId(null);
            const photoId = Number(e.dataTransfer.getData('photoId'));
            if (photoId && onDropPhoto) onDropPhoto(album.id, photoId);
          }}
        >
          {/* Drop overlay for photo drops */}
          {dragOverId === album.id && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/20 pointer-events-none">
              <span className="text-white font-semibold text-sm bg-primary/80 rounded-full px-3 py-1">Drop here</span>
            </div>
          )}
          {/* Title row */}
          <div className="px-3 pt-3 pb-2 flex items-center gap-2">
            {isAdmin && onReorder && (
              <span
                {...provided.dragHandleProps}
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
              >
                <GripVertical size={14} />
              </span>
            )}
            <p className="flex-1 text-base font-semibold text-foreground truncate">{album.name}</p>
            {isAdmin && (
              <div className="flex gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {onRename && (
                  <button
                    onClick={(e) => openRename(e, album)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Rename
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(album.id); }}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          {/* Cover image */}
          <div className="aspect-square bg-muted relative overflow-hidden">
            {album.background_image && (
              <img src={album.background_image} alt={album.name} className="w-full h-full object-cover" />
            )}
            <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white font-medium">
              {album.photo_count} {album.photo_count === 1 ? 'photo' : 'photos'}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  ));

  return (
    <>
    {renamingAlbum && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setRenamingAlbum(null)}>
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-base font-semibold text-foreground">Rename album</h2>
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setRenamingAlbum(null); }}
            autoFocus
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-3">
            <button onClick={saveRename} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Save</button>
            <button onClick={() => setRenamingAlbum(null)} className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent">Cancel</button>
          </div>
        </div>
      </div>
    )}
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="albums" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          >
            {cards}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
    </>
  );
}
