import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/shared/toast'
import { useCreateMember, useUpdateMember } from '../hooks/use-family-tree'
import type { FamilyMember } from '@/types/api'

interface MemberFormDialogProps {
  open: boolean
  onClose: () => void
  member?: FamilyMember | null
}

export function MemberFormDialog({ open, onClose, member }: MemberFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      {open && <MemberFormContent onClose={onClose} member={member} />}
    </Dialog>
  )
}

function MemberFormContent({ onClose, member }: { onClose: () => void; member?: FamilyMember | null }) {
  const { toast } = useToast()
  const createMember = useCreateMember()
  const updateMember = useUpdateMember()

  const [firstName, setFirstName] = useState(member?.first_name ?? '')
  const [lastName, setLastName] = useState(member?.last_name ?? '')
  const [birthDate, setBirthDate] = useState(member?.birth_date ?? '')
  const [deathDate, setDeathDate] = useState(member?.death_date ?? '')
  const [bio, setBio] = useState(member?.bio ?? '')

  const isEditing = !!member
  const isPending = createMember.isPending || updateMember.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) return

    try {
      const data = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_date: birthDate || undefined,
        death_date: deathDate || undefined,
        bio: bio.trim() || undefined,
      }

      if (isEditing) {
        await updateMember.mutateAsync({ id: member.id, data })
        toast('Member updated', 'success')
      } else {
        await createMember.mutateAsync(data)
        toast('Member added', 'success')
      }
      onClose()
    } catch {
      toast('Failed to save member', 'error')
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Edit Family Member' : 'Add Family Member'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>First Name *</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1">
            <Label>Last Name *</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Birth Date</Label>
            <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Death Date</Label>
            <Input type="date" value={deathDate} onChange={(e) => setDeathDate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Bio</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Short biography..." />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isPending || !firstName.trim() || !lastName.trim()}>
            {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Member'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
