export interface Project {
  id: string
  name: string
  color: string | null
  isArchived: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  name: string
  color: string | null
  createdAt: string
  updatedAt: string
}

export type TaskPriority = 'none' | 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  description: string | null
  projectId: string | null
  color: string | null
  priority: TaskPriority
  isDone: boolean
  doneAt: string | null
  dueDate: string | null
  scheduledAt: string | null
  scheduledEnd: string | null
  timeEstimateMinutes: number | null
  timeSpentSeconds: number
  sortOrder: number
  createdAt: string
  updatedAt: string
  tagIds: string[]
}

export interface CreateProjectInput {
  name: string
  color?: string | null
}

export interface UpdateProjectInput {
  name?: string
  color?: string | null
  isArchived?: boolean
  sortOrder?: number
}

export interface CreateTagInput {
  name: string
  color?: string | null
}

export interface UpdateTagInput {
  name?: string
  color?: string | null
}

export interface CreateTaskInput {
  title: string
  description?: string | null
  projectId?: string | null
  color?: string | null
  priority?: TaskPriority
  dueDate?: string | null
  timeEstimateMinutes?: number | null
  tagIds?: string[]
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  projectId?: string | null
  color?: string | null
  priority?: TaskPriority
  isDone?: boolean
  dueDate?: string | null
  scheduledAt?: string | null
  scheduledEnd?: string | null
  timeEstimateMinutes?: number | null
  sortOrder?: number
  tagIds?: string[]
}

export type TimeEntryType = 'manual' | 'pomodoro_work' | 'pomodoro_break'

export interface TimeEntry {
  id: string
  taskId: string
  startedAt: string
  endedAt: string | null
  durationSeconds: number | null
  type: TimeEntryType
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface TaskFilter {
  projectId?: string | null
  tagId?: string | null
  includeDone?: boolean
}

export interface ReportRange {
  from: string
  to: string
}

export interface ReportDayTotal {
  date: string
  totalSeconds: number
}

export interface ReportProjectTotal {
  projectId: string | null
  totalSeconds: number
}

export interface ReportTaskTotal {
  taskId: string
  title: string
  projectId: string | null
  totalSeconds: number
}

export interface ReportSummary {
  totalSeconds: number
  byDay: ReportDayTotal[]
  byProject: ReportProjectTotal[]
  byTask: ReportTaskTotal[]
}

export interface PomodoroSettings {
  workMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  cyclesBeforeLongBreak: number
}

export interface AppSettings {
  language: string
  theme: 'light' | 'dark' | 'auto'
  pomodoro: PomodoroSettings
}

export interface ExportTables {
  projects: Record<string, unknown>[]
  tags: Record<string, unknown>[]
  tasks: Record<string, unknown>[]
  taskTags: Record<string, unknown>[]
  timeEntries: Record<string, unknown>[]
  settings: Record<string, unknown>[]
}

export interface ExportData {
  schemaVersion: number
  exportedAt: string
  tables: ExportTables
}

export interface ExportResult {
  canceled: boolean
  filePath?: string
}

export interface ImportResult {
  canceled: boolean
  success?: boolean
  error?: 'invalidFile'
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  theme: 'auto',
  pomodoro: {
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    cyclesBeforeLongBreak: 4
  }
}
