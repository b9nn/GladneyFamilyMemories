import { useState } from 'react'
import { Plus, Link2, TreePine } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { TreeCanvas } from './components/tree-canvas'
import { MemberDetailPanel } from './components/member-detail-panel'
import { MemberFormDialog } from './components/member-form-dialog'
import { RelationshipFormDialog } from './components/relationship-form-dialog'
import { useFamilyTree, useDeleteMember, useDeleteRelationship } from './hooks/use-family-tree'
import { useTreeStore } from './stores/tree-store'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { useToast } from '@/components/shared/toast'

export function FamilyTreePage() {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const isAdmin = user?.is_admin ?? false
  const { data, isLoading } = useFamilyTree()
  const deleteMember = useDeleteMember()
  const deleteRelationship = useDeleteRelationship()

  const {
    selectedMemberId, isAddingMember, isAddingRelationship,
    setAddingMember, setAddingRelationship, editingMemberId,
    setEditingMember, selectMember,
  } = useTreeStore()

  const [deletingMemberId, setDeletingMemberId] = useState<number | null>(null)

  const selectedMember = data?.members.find((m) => m.id === selectedMemberId) ?? null
  const editingMember = data?.members.find((m) => m.id === editingMemberId) ?? null

  return (
    <div className="flex flex-col min-h-[50vh] md:h-[calc(100vh-10rem)]">
      <PageHeader
        title="Family Tree"
        description="Interactive family tree visualization"
        actions={
          isAdmin ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setAddingRelationship(true)}>
                <Link2 className="h-4 w-4" /> Add Relationship
              </Button>
              <Button onClick={() => setAddingMember(true)}>
                <Plus className="h-4 w-4" /> Add Member
              </Button>
            </div>
          ) : undefined
        }
      />

      {isLoading ? (
        <Skeleton className="flex-1" />
      ) : !data?.members.length ? (
        <EmptyState
          icon={TreePine}
          title="No family members yet"
          description={isAdmin ? "Add your first family member to start building the tree." : "The family tree hasn't been started yet."}
          action={isAdmin ? <Button onClick={() => setAddingMember(true)}><Plus className="h-4 w-4" /> Add Member</Button> : undefined}
        />
      ) : (
        <div className="flex flex-col md:flex-row flex-1 min-h-0 rounded-lg border overflow-hidden">
          <div className="flex-1">
            <TreeCanvas data={data} isAdmin={isAdmin} />
          </div>
          {selectedMember && (
            <MemberDetailPanel
              member={selectedMember}
              members={data.members}
              relationships={data.relationships}
              isAdmin={isAdmin}
              onEdit={() => { setEditingMember(selectedMember.id); selectMember(null) }}
              onDelete={() => setDeletingMemberId(selectedMember.id)}
              onDeleteRelationship={(id) => {
                deleteRelationship.mutate(id)
                toast('Relationship removed', 'success')
              }}
            />
          )}
        </div>
      )}

      <MemberFormDialog
        open={isAddingMember || !!editingMemberId}
        onClose={() => { setAddingMember(false); setEditingMember(null) }}
        member={editingMember}
      />

      <RelationshipFormDialog
        open={isAddingRelationship}
        onClose={() => setAddingRelationship(false)}
        members={data?.members ?? []}
      />

      <ConfirmDialog
        open={!!deletingMemberId}
        onOpenChange={() => setDeletingMemberId(null)}
        title="Delete Family Member"
        description="Delete this family member and all their relationships?"
        confirmLabel="Delete" destructive
        onConfirm={() => {
          if (deletingMemberId) {
            deleteMember.mutate(deletingMemberId)
            selectMember(null)
            toast('Member deleted', 'success')
          }
        }}
      />
    </div>
  )
}

export default FamilyTreePage
