import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useCreateAlbum } from '../hooks/use-albums'

interface AlbumCreateDialogProps {
  open: boolean
  onClose: () => void
}

export function AlbumCreateDialog({ open, onClose }: AlbumCreateDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const createAlbum = useCreateAlbum()

  const handleCreate = async () => {
    if (!name.trim()) return
    await createAlbum.mutateAsync({ name, description: description || undefined })
    setName('')
    setDescription('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Album</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Album Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Album" required />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe this album" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim() || createAlbum.isPending}>
            {createAlbum.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
