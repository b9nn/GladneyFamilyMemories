import { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
import type { Album, Photo, PhotoUpdate } from '@/types/api';

interface PhotoGridProps {
  photos: Photo[];
  isAdmin?: boolean;
  albums?: Album[];
  onDelete: (id: number) => void;
  onSelect?: (photo: Photo) => void;
  onSetCover?: (photo: Photo) => void;
  onUpdate?: (id: number, data: PhotoUpdate) => void;
  onAddToAlbum?: (photoId: number, albumId: number) => void;
  onPhotoDragStart?: (photoId: number) => void;
  onPhotoDragEnd?: () => void;
  deleteLabel?: string;
  draggable?: boolean;
  showDetails?: boolean;
  onReorderPhotos?: (orderedIds: number[]) => void;
}

interface PhotoCardProps {
  photo: Photo;
  isAdmin: boolean;
  albums?: Album[];
  onDelete: (id: number) => void;
  onSelect?: (photo: Photo) => void;
  onSetCover?: (photo: Photo) => void;
  onUpdate?: (id: number, data: PhotoUpdate) => void;
  onAddToAlbum?: (photoId: number, albumId: number) => void;
  onPhotoDragStart?: (photoId: number) => void;
  onPhotoDragEnd?: () => void;
  deleteLabel: string;
  draggable: boolean;
  showDetails: boolean;
}

// ── Edit modal ────────────────────────────────────────────────────────────────

interface PhotoEditModalProps {
  photo: Photo;
  onSave: (id: number, data: PhotoUpdate) => void;
  onClose: () => void;
}

function PhotoEditModal({ photo, onSave, onClose }: PhotoEditModalProps) {
  const [title, setTitle] = useState(photo.title ?? '');
  const [description, setDescription] = useState(photo.description ?? '');
  const [takenAt, setTakenAt] = useState(photo.taken_at ? photo.taken_at.slice(0, 10) : '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(photo.id, {
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      taken_at: takenAt || undefined,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Edit photo details</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
        </div>

        {/* Thumbnail */}
        {photo.url && (
          <div className="px-5 pt-4">
            <img
              src={photo.url}
              alt={photo.filename}
              className="w-full max-h-48 object-contain rounded-md bg-muted"
            />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={photo.filename}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description…"
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Date taken</label>
            <input
              type="date"
              value={takenAt}
              onChange={(e) => setTakenAt(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="pt-1 text-xs text-muted-foreground">
            Filename: {photo.filename} · Uploaded: {formatDate(photo.created_at)}
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Photo card ────────────────────────────────────────────────────────────────

function PhotoCard({ photo, isAdmin, albums, onDelete, onSelect, onSetCover, onUpdate, onAddToAlbum, onPhotoDragStart, onPhotoDragEnd, deleteLabel, draggable, showDetails }: PhotoCardProps) {
  const [takenAt, setTakenAt] = useState(photo.taken_at ? photo.taken_at.slice(0, 10) : '');
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showAlbumPicker) return;
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowAlbumPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showAlbumPicker]);

  function handleTakenAtBlur() {
    const original = photo.taken_at ? photo.taken_at.slice(0, 10) : '';
    if (takenAt !== original && onUpdate) {
      onUpdate(photo.id, { taken_at: takenAt || undefined });
    }
  }

  return (
    <>
      <div
        className={`group rounded-lg bg-card overflow-hidden border border-border ${showDetails ? '' : 'relative aspect-square'}`}
        draggable={draggable}
        onDragStart={draggable ? (e) => { e.dataTransfer.setData('photoId', String(photo.id)); onPhotoDragStart?.(photo.id); } : undefined}
        onDragEnd={draggable ? () => onPhotoDragEnd?.() : undefined}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {(photo.thumb_url || photo.url) ? (
            <img
              src={photo.thumb_url || photo.url || ''}
              onError={(e) => {
                const img = e.currentTarget;
                if (photo.url && img.src !== photo.url) img.src = photo.url;
              }}
              alt={photo.title ?? photo.filename}
              className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
              onClick={() => onSelect?.(photo)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              No preview
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-end justify-between gap-1">
              {!showDetails && photo.title && (
                <p className="text-xs text-white font-medium truncate">{photo.title}</p>
              )}
              {isAdmin && (
                <div className="ml-auto flex gap-1 relative" ref={pickerRef}>
                  {/* + Album picker */}
                  {onAddToAlbum && albums && albums.length > 0 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowAlbumPicker((v) => !v); }}
                        className="rounded bg-black/60 px-2 py-0.5 text-xs text-white hover:bg-primary transition-colors"
                      >
                        + Album
                      </button>
                      {showAlbumPicker && (
                        <div className="absolute bottom-full mb-1 right-0 z-20 min-w-[130px] rounded-md border border-border bg-card shadow-lg overflow-hidden">
                          {albums.map((album) => (
                            <button
                              key={album.id}
                              onClick={(e) => { e.stopPropagation(); onAddToAlbum(photo.id, album.id); setShowAlbumPicker(false); }}
                              className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                            >
                              {album.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {/* Edit */}
                  {onUpdate && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }}
                      className="rounded bg-black/60 px-2 py-0.5 text-xs text-white hover:bg-primary transition-colors"
                    >
                      Edit
                    </button>
                  )}
                  {/* Set cover */}
                  {onSetCover && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onSetCover(photo); }}
                      className="rounded bg-black/60 px-2 py-0.5 text-xs text-white hover:bg-primary transition-colors"
                    >
                      Cover
                    </button>
                  )}
                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }}
                    className="rounded bg-black/60 px-2 py-0.5 text-xs text-white hover:bg-red-500 transition-colors"
                  >
                    {deleteLabel}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details panel — admin only */}
        {showDetails && (
          <div className="p-2 space-y-1">
            <p className="text-xs text-foreground truncate" title={photo.filename}>
              {photo.title ?? photo.filename}
            </p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground flex-shrink-0">Taken:</span>
              <input
                type="date"
                value={takenAt}
                onChange={(e) => setTakenAt(e.target.value)}
                onBlur={handleTakenAtBlur}
                className="text-xs bg-transparent border-b border-border text-foreground focus:outline-none focus:border-primary w-full"
              />
            </div>
            <p className="text-xs text-muted-foreground">↑ {formatDate(photo.created_at)}</p>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {showEditModal && onUpdate && (
        <PhotoEditModal
          photo={photo}
          onSave={onUpdate}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}

// ── Grid ──────────────────────────────────────────────────────────────────────

export function PhotoGrid({ photos, isAdmin = false, albums, onDelete, onSelect, onSetCover, onUpdate, onAddToAlbum, onPhotoDragStart, onPhotoDragEnd, deleteLabel = 'Delete', draggable = false, showDetails = false, onReorderPhotos }: PhotoGridProps) {
  function handleReorderDragEnd(result: DropResult) {
    if (!result.destination || result.destination.index === result.source.index) return;
    const ids = photos.map(p => p.id);
    const [moved] = ids.splice(result.source.index, 1);
    ids.splice(result.destination.index, 0, moved);
    onReorderPhotos?.(ids);
  }

  if (onReorderPhotos) {
    return (
      <DragDropContext onDragEnd={handleReorderDragEnd}>
        <Droppable droppableId="album-photos" direction="horizontal">
          {(droppable) => (
            <div
              ref={droppable.innerRef}
              {...droppable.droppableProps}
              className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10"
            >
              {photos.map((photo, index) => (
                <Draggable key={photo.id} draggableId={String(photo.id)} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`relative ${snapshot.isDragging ? 'opacity-60 ring-2 ring-primary rounded-lg' : ''}`}
                    >
                      <PhotoCard
                        photo={photo}
                        isAdmin={isAdmin}
                        albums={albums}
                        onDelete={onDelete}
                        onSelect={onSelect}
                        onSetCover={onSetCover}
                        onUpdate={onUpdate}
                        onAddToAlbum={onAddToAlbum}
                        deleteLabel={deleteLabel}
                        draggable={false}
                        showDetails={showDetails}
                      />
                      <div
                        {...provided.dragHandleProps}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-1 left-1 z-20 rounded bg-black/60 p-0.5 text-white/80 hover:text-white cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical size={12} />
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {droppable.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          isAdmin={isAdmin}
          albums={albums}
          onDelete={onDelete}
          onSelect={onSelect}
          onSetCover={onSetCover}
          onUpdate={onUpdate}
          onAddToAlbum={onAddToAlbum}
          onPhotoDragStart={onPhotoDragStart}
          onPhotoDragEnd={onPhotoDragEnd}
          deleteLabel={deleteLabel}
          draggable={draggable}
          showDetails={showDetails}
        />
      ))}
    </div>
  );
}
