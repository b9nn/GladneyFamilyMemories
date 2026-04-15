import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/shared/toast'
import { useCreateRelationship } from '../hooks/use-family-tree'
import type { FamilyMember } from '@/types/api'

interface RelationshipFormDialogProps {
  open: boolean
  onClose: () => void
  members: FamilyMember[]
}

export function RelationshipFormDialog({ open, onClose, members }: RelationshipFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      {open && <RelationshipFormContent onClose={onClose} members={members} />}
    </Dialog>
  )
}

function RelationshipFormContent({ onClose, members }: { onClose: () => void; members: FamilyMember[] }) {
  const { toast } = useToast()
  const create = useCreateRelationship()

  const [personAId, setPersonAId] = useState('')
  const [personBId, setPersonBId] = useState('')
  const [relType, setRelType] = useState<'parent_child' | 'spouse' | 'sibling'>('parent_child')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!personAId || !personBId || personAId === personBId) return

    try {
      await create.mutateAsync({
        person_a_id: Number(personAId),
        person_b_id: Number(personBId),
        relationship_type: relType,
      })
      toast('Relationship created', 'success')
      onClose()
    } catch {
      toast('Failed to create relationship', 'error')
    }
  }

  const labels = {
    parent_child: { a: 'Parent', b: 'Child' },
    spouse: { a: 'Person 1', b: 'Person 2' },
    sibling: { a: 'Sibling 1', b: 'Sibling 2' },
  }

  return (
    <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Relationship</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Relationship Type</Label>
            <Select value={relType} onChange={(e) => setRelType(e.target.value as typeof relType)}>
              <option value="parent_child">Parent → Child</option>
              <option value="spouse">Spouse</option>
              <option value="sibling">Sibling</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{labels[relType].a}</Label>
              <Select value={personAId} onChange={(e) => setPersonAId(e.target.value)}>
                <option value="">Select...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{labels[relType].b}</Label>
              <Select value={personBId} onChange={(e) => setPersonBId(e.target.value)}>
                <option value="">Select...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                ))}
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={create.isPending || !personAId || !personBId || personAId === personBId}>
              {create.isPending ? 'Creating...' : 'Add Relationship'}
            </Button>
          </DialogFooter>
        </form>
    </DialogContent>
  )
}
