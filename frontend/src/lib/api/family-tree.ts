import { client } from './client'
import type { FamilyMember, FamilyMemberCreate, FamilyRelationship, FamilyRelationshipCreate } from '@/types/api'
export const familyTreeApi = {
  listMembers: () => client.get<FamilyMember[]>('/api/family-tree/members').then(r => r.data),
  createMember: (data: FamilyMemberCreate) => client.post<FamilyMember>('/api/family-tree/members', data).then(r => r.data),
  updateMember: (id: number, data: Partial<FamilyMemberCreate>) => client.put<FamilyMember>(`/api/family-tree/members/${id}`, data).then(r => r.data),
  deleteMember: (id: number) => client.delete(`/api/family-tree/members/${id}`).then(r => r.data),
  listRelationships: () => client.get<FamilyRelationship[]>('/api/family-tree/relationships').then(r => r.data),
  createRelationship: (data: FamilyRelationshipCreate) => client.post<FamilyRelationship>('/api/family-tree/relationships', data).then(r => r.data),
  deleteRelationship: (id: number) => client.delete(`/api/family-tree/relationships/${id}`).then(r => r.data),
}
