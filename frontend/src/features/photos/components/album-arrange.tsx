import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/shared/toast'
import { useReorderAlbums } from '../hooks/use-albums'
import type { Album } from '@/types/api'
import { useState } from 'react'

interface AlbumArrangeProps {
  albums: Album[]
  onDone: () => void
}

export function AlbumArrange({ albums, onDone }: AlbumArrangeProps) {
  const { toast } = useToast()
  const reorder = useReorderAlbums()
  const [items, setItems] = useState(albums)

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const reordered = Array.from(items)
    const [moved] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)
    setItems(reordered)
  }

  const handleSave = async () => {
    const orders = items.map((a, i) => ({ id: a.id, sort_order: i }))
    try {
      await reorder.mutateAsync(orders)
      toast('Album order saved', 'success')
      onDone()
    } catch {
      toast('Failed to save order', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Drag albums to reorder them.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onDone}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={reorder.isPending}>
            {reorder.isPending ? 'Saving...' : 'Save Order'}
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="albums" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
            >
              {items.map((album, index) => (
                <Draggable key={album.id} draggableId={String(album.id)} index={index}>
                  {(prov, snapshot) => (
                    <div
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      {...prov.dragHandleProps}
                      className={`rounded-lg border p-3 bg-card ${
                        snapshot.isDragging ? 'border-primary shadow-lg' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm truncate">{album.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {album.photo_count ?? 0} photos
                        </span>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
