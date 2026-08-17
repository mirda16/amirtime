import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type {
  AppSettings,
  CreateProjectInput,
  CreateSubtaskInput,
  CreateTagInput,
  CreateTaskInput,
  ExportResult,
  ImportResult,
  Project,
  ReportSummary,
  Tag,
  Task,
  TaskFilter,
  TimeEntry,
  UpdateProjectInput,
  UpdateSubtaskInput,
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
      ipcRenderer.invoke(IpcChannels.tasksReorder, orderedIds),
    archive: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.tasksArchive, id),
    unarchive: (id: string): Promise<Task> => ipcRenderer.invoke(IpcChannels.tasksUnarchive, id)
  },
  timeEntries: {
    getActive: (): Promise<TimeEntry | null> =>
      ipcRenderer.invoke(IpcChannels.timeEntriesGetActive),
    start: (taskId: string): Promise<TimeEntry> =>
      ipcRenderer.invoke(IpcChannels.timeEntriesStart, taskId),
    stop: (entryId: string): Promise<{ entry: TimeEntry; task: Task | null }> =>
      ipcRenderer.invoke(IpcChannels.timeEntriesStop, entryId)
  },
  reports: {
    getSummary: (from: string, to: string): Promise<ReportSummary> =>
      ipcRenderer.invoke(IpcChannels.reportsGetSummary, from, to)
  },
  settings: {
    getAll: (): Promise<AppSettings> => ipcRenderer.invoke(IpcChannels.settingsGetAll),
    set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.settingsSet, key, value)
  },
  notifications: {
    show: (opts: { title: string; body: string }): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.notificationsShow, opts),
    onClicked: (callback: () => void): (() => void) => {
      ipcRenderer.on(IpcChannels.notificationClicked, callback)
      return () => ipcRenderer.removeListener(IpcChannels.notificationClicked, callback)
    }
  },
  dataIO: {
    exportAll: (): Promise<ExportResult> => ipcRenderer.invoke(IpcChannels.dataIoExportAll),
    importAll: (): Promise<ImportResult> => ipcRenderer.invoke(IpcChannels.dataIoImportAll)
  },
  subtasks: {
    create: (taskId: string, input: CreateSubtaskInput): Promise<Task> =>
      ipcRenderer.invoke(IpcChannels.subtasksCreate, taskId, input),
    update: (subtaskId: string, taskId: string, patch: UpdateSubtaskInput): Promise<Task> =>
      ipcRenderer.invoke(IpcChannels.subtasksUpdate, subtaskId, taskId, patch),
    delete: (subtaskId: string, taskId: string): Promise<Task> =>
      ipcRenderer.invoke(IpcChannels.subtasksDelete, subtaskId, taskId)
  },
  sync: {
    getPath: (): Promise<string | null> => ipcRenderer.invoke(IpcChannels.syncGetPath),
    /** Create a new sync file at a user-chosen location and export local data into it. */
    selectPath: (): Promise<string | null> => ipcRenderer.invoke(IpcChannels.syncSelectPath),
    /** Connect to an existing sync file from another device and merge-import its data. */
    connectPath: (): Promise<string | null> => ipcRenderer.invoke(IpcChannels.syncConnectPath),
    clearPath: (): Promise<void> => ipcRenderer.invoke(IpcChannels.syncClearPath),
    exportNow: (): Promise<void> => ipcRenderer.invoke(IpcChannels.syncExportNow),
    importNow: (): Promise<boolean> => ipcRenderer.invoke(IpcChannels.syncImportNow),
    onDataChanged: (callback: () => void): (() => void) => {
      ipcRenderer.on(IpcChannels.syncDataChanged, callback)
      return () => ipcRenderer.removeListener(IpcChannels.syncDataChanged, callback)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
