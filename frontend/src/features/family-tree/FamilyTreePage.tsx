import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { MemberForm } from './components/MemberForm';
import { TreeCanvas } from './components/TreeCanvas';
import {
  useFamilyMembers,
  useFamilyRelationships,
  useCreateMember,
  useUpdateMember,
  useDeleteMember,
  useCreateRelationship,
  useDeleteRelationship,
} from './hooks/useFamilyTree';
import type { FamilyMember } from '@/types/api';

export function FamilyTreePage() {
  const { data: members = [], isLoading: loadingMembers } = useFamilyMembers();
  const { data: relationships = [], isLoading: loadingRels } = useFamilyRelationships();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();
  const createRelationship = useCreateRelationship();
  const deleteRelationship = useDeleteRelationship();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [relForm, setRelForm] = useState<{ person_b_id: string; relationship_type: 'parent_child' | 'spouse' | 'sibling' }>({ person_b_id: '', relationship_type: 'parent_child' });
  const [error, setError] = useState('');

  const isLoading = loadingMembers || loadingRels;

  async function handleCreate(data: { first_name: string; last_name: string; birth_date: string; death_date: string; bio: string }) {
    await createMember.mutateAsync({
      first_name: data.first_name,
      last_name: data.last_name || undefined,
      birth_date: data.birth_date || undefined,
      death_date: data.death_date || undefined,
      bio: data.bio || undefined,
    });
    setShowAddForm(false);
  }

  async function handleUpdate(data: { first_name: string; last_name: string; birth_date: string; death_date: string; bio: string }) {
    if (!editingMember) return;
    await updateMember.mutateAsync({
      id: editingMember.id,
      data: {
        first_name: data.first_name,
        last_name: data.last_name || undefined,
        birth_date: data.birth_date || undefined,
        death_date: data.death_date || undefined,
        bio: data.bio || undefined,
      },
    });
    setEditingMember(null);
    setSelectedMember(null);
  }

  function handleDeleteMember(id: number) {
    if (!confirm('Delete this family member? Their relationships will also be removed.')) return;
    deleteMember.mutate(id);
    setSelectedMember(null);
  }

  async function handleAddRelationship(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMember || !relForm.person_b_id) return;
    setError('');
    try {
      await createRelationship.mutateAsync({
        person_a_id: selectedMember.id,
        person_b_id: Number(relForm.person_b_id),
        relationship_type: relForm.relationship_type,
      });
      setRelForm({ person_b_id: '', relationship_type: 'parent_child' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add relationship');
    }
  }

  const memberRelationships = selectedMember
    ? relationships.filter((r) => r.person_a_id === selectedMember.id || r.person_b_id === selectedMember.id)
    : [];

  if (showAddForm) {
    return (
      <div className="max-w-lg">
        <PageHeader title="Add Family Member" />
        <MemberForm onSave={handleCreate} onCancel={() => setShowAddForm(false)} />
      </div>
    );
  }

  if (editingMember) {
    return (
      <div className="max-w-lg">
        <PageHeader title="Edit Family Member" />
        <MemberForm initial={editingMember} onSave={handleUpdate} onCancel={() => setEditingMember(null)} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Family Tree"
        description="Explore family connections"
        action={
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Add member
          </button>
        }
      />

      {isLoading ? (
        <div className="h-[600px] rounded-lg border border-border bg-muted animate-pulse" />
      ) : !members.length ? (
        <EmptyState
          title="No family members yet"
          description="Add your first family member to start building the tree."
          action={
            <button
              onClick={() => setShowAddForm(true)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Add member
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          <TreeCanvas
            members={members}
            relationships={relationships}
            onSelectMember={setSelectedMember}
          />

          {selectedMember && (
            <div className="rounded-lg border border-border bg-card p-6 max-w-xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {selectedMember.first_name} {selectedMember.last_name}
                  </h3>
                  {selectedMember.birth_date && (
                    <p className="text-sm text-muted-foreground">
                      b. {selectedMember.birth_date}
                      {selectedMember.death_date ? ` — d. ${selectedMember.death_date}` : ''}
                    </p>
                  )}
                  {selectedMember.bio && (
                    <p className="text-sm text-muted-foreground mt-2">{selectedMember.bio}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingMember(selectedMember)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMember(selectedMember.id)}
                    className="text-sm text-muted-foreground hover:text-destructive"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {memberRelationships.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-foreground mb-2">Relationships</p>
                  <div className="space-y-1">
                    {memberRelationships.map((rel) => {
                      const otherId = rel.person_a_id === selectedMember.id ? rel.person_b_id : rel.person_a_id;
                      const other = members.find((m) => m.id === otherId);
                      return (
                        <div key={rel.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {rel.relationship_type.replace('_', ' ')} → {other?.first_name} {other?.last_name}
                          </span>
                          <button
                            onClick={() => deleteRelationship.mutate(rel.id)}
                            className="text-xs text-muted-foreground hover:text-destructive"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-foreground mb-2">Add relationship</p>
                {error && (
                  <div className="mb-2 rounded-md bg-destructive/10 border border-destructive/20 p-2 text-xs text-destructive">{error}</div>
                )}
                <form onSubmit={handleAddRelationship} className="flex gap-2">
                  <select
                    value={relForm.person_b_id}
                    onChange={(e) => setRelForm((prev) => ({ ...prev, person_b_id: e.target.value }))}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select person…</option>
                    {members
                      .filter((m) => m.id !== selectedMember.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.first_name} {m.last_name}
                        </option>
                      ))}
                  </select>
                  <select
                    value={relForm.relationship_type}
                    onChange={(e) => setRelForm((prev) => ({ ...prev, relationship_type: e.target.value as 'parent_child' | 'spouse' | 'sibling' }))}
                    className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="parent_child">Parent → Child</option>
                    <option value="spouse">Spouse</option>
                    <option value="sibling">Sibling</option>
                  </select>
                  <button
                    type="submit"
                    disabled={!relForm.person_b_id}
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
