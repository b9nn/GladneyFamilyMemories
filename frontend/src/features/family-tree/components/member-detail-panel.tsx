import { X, Pencil, Trash2, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AuthenticatedImage } from '@/components/shared/authenticated-image'
import { useTreeStore } from '../stores/tree-store'
import type { FamilyMember, FamilyRelationship } from '@/types/api'

interface MemberDetailPanelProps {
  member: FamilyMember
  members: FamilyMember[]
  relationships: FamilyRelationship[]
  isAdmin: boolean
  onEdit: () => void
  onDelete: () => void
  onDeleteRelationship: (id: number) => void
}

export function MemberDetailPanel({
  member, members, relationships, isAdmin, onEdit, onDelete, onDeleteRelationship,
}: MemberDetailPanelProps) {
  const { selectMember } = useTreeStore()
  const memberMap = new Map(members.map((m) => [m.id, m]))

  // Get relationships involving this member
  const memberRels = relationships.filter(
    (r) => r.person_a_id === member.id || r.person_b_id === member.id
  )

  const getRelLabel = (rel: FamilyRelationship) => {
    const otherId = rel.person_a_id === member.id ? rel.person_b_id : rel.person_a_id
    const other = memberMap.get(otherId)
    const name = other ? `${other.first_name} ${other.last_name}` : 'Unknown'

    if (rel.relationship_type === 'spouse') return { label: 'Spouse', name, otherId }
    if (rel.relationship_type === 'sibling') return { label: 'Sibling', name, otherId }
    // parent_child: person_a is parent, person_b is child
    if (rel.person_a_id === member.id) return { label: 'Child', name, otherId }
    return { label: 'Parent', name, otherId }
  }

  const years = [
    member.birth_date?.slice(0, 4),
    member.death_date ? member.death_date.slice(0, 4) : member.birth_date ? 'Present' : null,
  ].filter(Boolean).join(' – ')

  return (
    <div className="w-full md:w-80 border-t md:border-t-0 md:border-l bg-card p-4 overflow-y-auto space-y-4 max-h-[50vh] md:max-h-none">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Member Details</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => selectMember(null)} aria-label="Close details">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Portrait */}
      {member.photo_id ? (
        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
          <AuthenticatedImage photoId={member.photo_id} alt={`${member.first_name} ${member.last_name}`} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-square rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="text-4xl font-bold text-primary">{member.first_name[0]}{member.last_name[0]}</span>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold">{member.first_name} {member.last_name}</h2>
        {years && <p className="text-sm text-muted-foreground">{years}</p>}
      </div>

      {member.bio && <p className="text-sm">{member.bio}</p>}

      {/* Relationships */}
      {memberRels.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-1"><Link2 className="h-3.5 w-3.5" /> Relationships</h4>
          {memberRels.map((rel) => {
            const { label, name, otherId } = getRelLabel(rel)
            return (
              <div key={rel.id} className="flex items-center justify-between text-sm">
                <button onClick={() => selectMember(otherId)} className="hover:underline text-left">
                  <Badge variant="secondary" className="mr-1.5">{label}</Badge>
                  {name}
                </button>
                {isAdmin && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDeleteRelationship(rel.id)} aria-label={`Remove ${name} relationship`}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Admin actions */}
      {isAdmin && (
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="destructive" size="sm" className="flex-1" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      )}
    </div>
  )
}
