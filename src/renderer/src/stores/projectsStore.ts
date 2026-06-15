import { create } from 'zustand'
import type { CreateProjectInput, Project, UpdateProjectInput } from '@shared/types'

interface ProjectsState {
  projects: Project[]
  isLoaded: boolean
  loadProjects: () => Promise<void>
  createProject: (input: CreateProjectInput) => Promise<Project>
  updateProject: (id: string, patch: UpdateProjectInput) => Promise<void>
  deleteProject: (id: string) => Promise<void>
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  isLoaded: false,

  loadProjects: async () => {
    const projects = await window.api.projects.getAll()
    set({ projects, isLoaded: true })
  },

  createProject: async (input) => {
    const project = await window.api.projects.create(input)
    set({ projects: [...get().projects, project] })
    return project
  },

  updateProject: async (id, patch) => {
    const updated = await window.api.projects.update(id, patch)
    set({ projects: get().projects.map((p) => (p.id === id ? updated : p)) })
  },

  deleteProject: async (id) => {
    await window.api.projects.delete(id)
    set({ projects: get().projects.filter((p) => p.id !== id) })
  }
}))
