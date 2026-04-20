import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { familyTreeApi } from '@/lib/api/family-tree';
import type { FamilyMember, FamilyMemberCreate, FamilyRelationshipCreate } from '@/types/api';

const MEMBERS_KEY = ['family-tree', 'members'];
const RELS_KEY = ['family-tree', 'relationships'];

export function useFamilyMembers() {
  return useQuery({ queryKey: MEMBERS_KEY, queryFn: familyTreeApi.listMembers });
}

export function useFamilyRelationships() {
  return useQuery({ queryKey: RELS_KEY, queryFn: familyTreeApi.listRelationships });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FamilyMemberCreate) => familyTreeApi.createMember(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEMBERS_KEY }),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FamilyMemberCreate> }) =>
      familyTreeApi.updateMember(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEMBERS_KEY }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => familyTreeApi.deleteMember(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEMBERS_KEY });
      qc.invalidateQueries({ queryKey: RELS_KEY });
    },
  });
}

export function useCreateRelationship() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FamilyRelationshipCreate) => familyTreeApi.createRelationship(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: RELS_KEY }),
  });
}

export function useDeleteRelationship() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => familyTreeApi.deleteRelationship(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: RELS_KEY }),
  });
}

export function useResetLayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (members: FamilyMember[]) => {
      await Promise.all(
        members.map((m) =>
          familyTreeApi.updateMember(m.id, { position_x: 0, position_y: 0 }),
        ),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: MEMBERS_KEY }),
  });
}
