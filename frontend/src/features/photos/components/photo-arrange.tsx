import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { GripVertical } from 'lucide-react'
import { AuthenticatedImage } from '@/components/shared/authenticated-image'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/shared/toast'
import { useReorderPhotos } from '../hooks/use-photos'
import type { Photo } from '@/types/api'
import { useState } from 'react'

interface PhotoArrangeProps {
  photos: Photo[]
  onDone: () => void
}

export function PhotoArrange({ photos, onDone }: PhotoArrangeProps) {
  const { toast } = useToast()
  const reorder = useReorderPhotos()
  const [items, setItems] = useState(photos)

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const reordered = Array.from(items)
    const [moved] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)
    setItems(reordered)
  }

  const handleSave = async () => {
    const orders = items.map((p, i) => ({ id: p.id, sort_order: i }))
    try {
      await reorder.mutateAsync(orders)
      toast('Photo order saved', 'success')
      onDone()
    } catch {
      toast('Failed to save order', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Drag photos to reorder them.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onDone}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={reorder.isPending}>
            {reorder.isPending ? 'Saving...' : 'Save Order'}
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="photos" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2"
            >
              {items.map((photo, index) => (
                <Draggable key={photo.id} draggableId={String(photo.id)} index={index}>
                  {(prov, snapshot) => (
                    <div
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      {...prov.dragHandleProps}
                      className={`relative aspect-square rounded-lg overflow-hidden bg-muted border-2 ${
                        snapshot.isDragging ? 'border-primary shadow-lg' : 'border-transparent'
                      }`}
                    >
                      <AuthenticatedImage
                        photoId={photo.id}
                        alt={photo.title || 'Photo'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1 left-1 bg-black/50 rounded p-0.5">
                        <GripVertical className="h-3.5 w-3.5 text-white" />
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
