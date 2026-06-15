import { create } from 'zustand'
import type { CreateTagInput, Tag, UpdateTagInput } from '@shared/types'

interface TagsState {
  tags: Tag[]
  isLoaded: boolean
  loadTags: () => Promise<void>
  createTag: (input: CreateTagInput) => Promise<Tag>
  updateTag: (id: string, patch: UpdateTagInput) => Promise<void>
  deleteTag: (id: string) => Promise<void>
}

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
  isLoaded: false,

  loadTags: async () => {
    const tags = await window.api.tags.getAll()
    set({ tags, isLoaded: true })
  },

  createTag: async (input) => {
    const tag = await window.api.tags.create(input)
    set({ tags: [...get().tags, tag] })
    return tag
  },

  updateTag: async (id, patch) => {
    const updated = await window.api.tags.update(id, patch)
    set({ tags: get().tags.map((t) => (t.id === id ? updated : t)) })
  },

  deleteTag: async (id) => {
    await window.api.tags.delete(id)
    set({ tags: get().tags.filter((t) => t.id !== id) })
  }
}))
