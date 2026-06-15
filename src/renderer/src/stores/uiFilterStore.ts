import { create } from 'zustand'

interface UiFilterState {
  selectedProjectId: string | null
  selectedTagId: string | null
  setSelectedProjectId: (id: string | null) => void
  setSelectedTagId: (id: string | null) => void
}

export const useUiFilterStore = create<UiFilterState>((set) => ({
  selectedProjectId: null,
  selectedTagId: null,
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setSelectedTagId: (id) => set({ selectedTagId: id })
}))
