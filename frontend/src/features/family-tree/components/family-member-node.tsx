import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { AuthenticatedImage } from '@/components/shared/authenticated-image'
import { useTreeStore } from '../stores/tree-store'
import { cn } from '@/lib/utils'
import type { FamilyMember } from '@/types/api'

function FamilyMemberNodeInner({ data }: NodeProps) {
  const member = data as unknown as FamilyMember
  const { selectedMemberId, selectMember } = useTreeStore()
  const isSelected = selectedMemberId === member.id

  const years = [
    member.birth_date?.slice(0, 4),
    member.death_date ? member.death_date.slice(0, 4) : member.birth_date ? 'Present' : null,
  ].filter(Boolean).join(' – ')

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-primary !w-2 !h-2" />
      <div
        onClick={() => selectMember(isSelected ? null : member.id)}
        className={cn(
          'rounded-lg border bg-card p-3 shadow-sm cursor-pointer transition-all w-[180px]',
          'hover:shadow-md',
          isSelected && 'ring-2 ring-primary border-primary',
        )}
      >
        <div className="flex items-center gap-2">
          {member.photo_id ? (
            <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 bg-muted">
              <AuthenticatedImage
                photoId={member.photo_id}
                alt={`${member.first_name} ${member.last_name}`}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">
                {member.first_name[0]}{member.last_name[0]}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{member.first_name} {member.last_name}</p>
            {years && <p className="text-xs text-muted-foreground">{years}</p>}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2 !h-2" />
    </>
  )
}

export const FamilyMemberNode = memo(FamilyMemberNodeInner)
