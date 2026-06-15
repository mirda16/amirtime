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

export interface Task {
  id: string
  title: string
  description: string | null
  projectId: string | null
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
  dueDate?: string | null
  timeEstimateMinutes?: number | null
  tagIds?: string[]
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  projectId?: string | null
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
