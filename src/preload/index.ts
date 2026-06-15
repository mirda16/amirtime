import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type {
  AppSettings,
  CreateProjectInput,
  CreateTagInput,
  CreateTaskInput,
  Project,
  Tag,
  Task,
  TaskFilter,
  TimeEntry,
  UpdateProjectInput,
  UpdateTagInput,
  UpdateTaskInput
} from '@shared/types'

const api = {
  projects: {
    getAll: (): Promise<Project[]> => ipcRenderer.invoke(IpcChannels.projectsGetAll),
    create: (input: CreateProjectInput): Promise<Project> =>
      ipcRenderer.invoke(IpcChannels.projectsCreate, input),
    update: (id: string, patch: UpdateProjectInput): Promise<Project> =>
      ipcRenderer.invoke(IpcChannels.projectsUpdate, id, patch),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.projectsDelete, id),
    reorder: (orderedIds: string[]): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.projectsReorder, orderedIds)
  },
  tags: {
    getAll: (): Promise<Tag[]> => ipcRenderer.invoke(IpcChannels.tagsGetAll),
    create: (input: CreateTagInput): Promise<Tag> =>
      ipcRenderer.invoke(IpcChannels.tagsCreate, input),
    update: (id: string, patch: UpdateTagInput): Promise<Tag> =>
      ipcRenderer.invoke(IpcChannels.tagsUpdate, id, patch),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.tagsDelete, id)
  },
  tasks: {
    getAll: (filter?: TaskFilter): Promise<Task[]> =>
      ipcRenderer.invoke(IpcChannels.tasksGetAll, filter),
    getById: (id: string): Promise<Task | null> =>
      ipcRenderer.invoke(IpcChannels.tasksGetById, id),
    create: (input: CreateTaskInput): Promise<Task> =>
      ipcRenderer.invoke(IpcChannels.tasksCreate, input),
    update: (id: string, patch: UpdateTaskInput): Promise<Task> =>
      ipcRenderer.invoke(IpcChannels.tasksUpdate, id, patch),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.tasksDelete, id),
    setTags: (taskId: string, tagIds: string[]): Promise<Task> =>
      ipcRenderer.invoke(IpcChannels.tasksSetTags, taskId, tagIds),
    reorder: (orderedIds: string[]): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.tasksReorder, orderedIds)
  },
  timeEntries: {
    getActive: (): Promise<TimeEntry | null> =>
      ipcRenderer.invoke(IpcChannels.timeEntriesGetActive),
    start: (taskId: string): Promise<TimeEntry> =>
      ipcRenderer.invoke(IpcChannels.timeEntriesStart, taskId),
    stop: (entryId: string): Promise<{ entry: TimeEntry; task: Task | null }> =>
      ipcRenderer.invoke(IpcChannels.timeEntriesStop, entryId)
  },
  settings: {
    getAll: (): Promise<AppSettings> => ipcRenderer.invoke(IpcChannels.settingsGetAll),
    set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.settingsSet, key, value)
  },
  notifications: {
    show: (opts: { title: string; body: string }): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.notificationsShow, opts)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
