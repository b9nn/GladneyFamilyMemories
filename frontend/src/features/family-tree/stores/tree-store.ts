import { create } from 'zustand'

interface TreeState {
  selectedMemberId: number | null
  isAddingMember: boolean
  editingMemberId: number | null
  isAddingRelationship: boolean
  selectMember: (id: number | null) => void
  setAddingMember: (v: boolean) => void
  setEditingMember: (id: number | null) => void
  setAddingRelationship: (v: boolean) => void
}

export const useTreeStore = create<TreeState>((set) => ({
  selectedMemberId: null,
  isAddingMember: false,
  editingMemberId: null,
  isAddingRelationship: false,
  selectMember: (id) => set({ selectedMemberId: id }),
  setAddingMember: (v) => set({ isAddingMember: v }),
  setEditingMember: (id) => set({ editingMemberId: id }),
  setAddingRelationship: (v) => set({ isAddingRelationship: v }),
}))
