import { create } from 'zustand'
import type { CreateSubtaskInput, CreateTaskInput, Task, UpdateSubtaskInput, UpdateTaskInput } from '@shared/types'
import { useTimerStore } from './timerStore'

interface TasksState {
  tasks: Task[]
  isLoaded: boolean
  loadTasks: () => Promise<void>
  createTask: (input: CreateTaskInput) => Promise<Task>
  updateTask: (id: string, patch: UpdateTaskInput) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleDone: (id: string) => Promise<void>
  reorderTasks: (orderedIds: string[]) => Promise<void>
  createSubtask: (taskId: string, input: CreateSubtaskInput) => Promise<void>
  updateSubtask: (subtaskId: string, taskId: string, patch: UpdateSubtaskInput) => Promise<void>
  deleteSubtask: (subtaskId: string, taskId: string) => Promise<void>
}

function replaceTask(tasks: Task[], updated: Task): Task[] {
  return tasks.map((t) => (t.id === updated.id ? updated : t))
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoaded: false,

  loadTasks: async () => {
    const tasks = await window.api.tasks.getAll({ includeDone: true })
    set({ tasks, isLoaded: true })
  },

  createTask: async (input) => {
    const task = await window.api.tasks.create(input)
    set({ tasks: [...get().tasks, task] })
    return task
  },

  updateTask: async (id, patch) => {
    const updated = await window.api.tasks.update(id, patch)
    set({ tasks: replaceTask(get().tasks, updated) })
  },

  deleteTask: async (id) => {
    if (useTimerStore.getState().activeEntry?.taskId === id) {
      useTimerStore.getState().reset()
    }
    await window.api.tasks.delete(id)
    set({ tasks: get().tasks.filter((t) => t.id !== id) })
  },

  toggleDone: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    const updated = await window.api.tasks.update(id, { isDone: !task.isDone })
    set({ tasks: replaceTask(get().tasks, updated) })
  },

  reorderTasks: async (orderedIds) => {
    await window.api.tasks.reorder(orderedIds)
    const order = new Map(orderedIds.map((id, index) => [id, index]))
    set({
      tasks: get()
        .tasks.map((t) => (order.has(t.id) ? { ...t, sortOrder: order.get(t.id)! } : t))
        .sort((a, b) => a.sortOrder - b.sortOrder)
    })
  },

  createSubtask: async (taskId, input) => {
    const updated = await window.api.subtasks.create(taskId, input)
    set({ tasks: replaceTask(get().tasks, updated) })
  },

  updateSubtask: async (subtaskId, taskId, patch) => {
    const updated = await window.api.subtasks.update(subtaskId, taskId, patch)
    set({ tasks: replaceTask(get().tasks, updated) })
  },

  deleteSubtask: async (subtaskId, taskId) => {
    const updated = await window.api.subtasks.delete(subtaskId, taskId)
    set({ tasks: replaceTask(get().tasks, updated) })
  }
}))
