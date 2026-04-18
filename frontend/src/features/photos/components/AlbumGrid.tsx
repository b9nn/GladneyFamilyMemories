import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';
import type { Album } from '@/types/api';

interface AlbumGridProps {
  albums: Album[];
  isAdmin: boolean;
  onSelect: (album: Album) => void;
  onDelete: (id: number) => void;
  onDropPhoto?: (albumId: number, photoId: number) => void;
  onReorder?: (orderedIds: number[]) => void;
}

export function AlbumGrid({ albums, isAdmin, onSelect, onDelete, onDropPhoto, onReorder }: AlbumGridProps) {
  const [dragOverId, setDragOverId] = useState<number | null>(null);

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
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(album.id); }}
                className="flex-shrink-0 text-xs text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Delete
              </button>
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
  );
}
