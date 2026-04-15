import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { familyTreeApi } from '@/lib/api/family-tree'
import type { FamilyMemberCreate, FamilyMemberUpdate, FamilyRelationshipCreate, NodePosition } from '@/types/api'

export function useFamilyTree() {
  return useQuery({ queryKey: ['family-tree'], queryFn: familyTreeApi.getTree })
}

export function useCreateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: FamilyMemberCreate) => familyTreeApi.createMember(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['family-tree'] }),
  })
}

export function useUpdateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FamilyMemberUpdate }) => familyTreeApi.updateMember(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['family-tree'] }),
  })
}

export function useDeleteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => familyTreeApi.deleteMember(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['family-tree'] }),
  })
}

export function useCreateRelationship() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: FamilyRelationshipCreate) => familyTreeApi.createRelationship(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['family-tree'] }),
  })
}

export function useDeleteRelationship() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => familyTreeApi.deleteRelationship(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['family-tree'] }),
  })
}

export function useSaveLayout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (positions: NodePosition[]) => familyTreeApi.saveLayout(positions),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['family-tree'] }),
  })
}
