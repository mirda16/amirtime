import { create } from 'zustand'
import type { TimeEntry } from '@shared/types'
import { useTasksStore } from './tasksStore'

interface TimerState {
  activeEntry: TimeEntry | null
  elapsedSeconds: number
  intervalId: ReturnType<typeof setInterval> | null
  init: () => Promise<void>
  start: (taskId: string) => Promise<void>
  stop: () => Promise<void>
  reset: () => void
}

function secondsSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
}

function startTicking(set: (partial: Partial<TimerState>) => void, get: () => TimerState): ReturnType<typeof setInterval> {
  return setInterval(() => {
    const entry = get().activeEntry
    if (entry) set({ elapsedSeconds: secondsSince(entry.startedAt) })
  }, 1000)
}

export const useTimerStore = create<TimerState>((set, get) => ({
  activeEntry: null,
  elapsedSeconds: 0,
  intervalId: null,

  init: async () => {
    const active = await window.api.timeEntries.getActive()
    if (active) {
      const intervalId = startTicking(set, get)
      set({ activeEntry: active, elapsedSeconds: secondsSince(active.startedAt), intervalId })
    }
  },

  start: async (taskId) => {
    if (get().activeEntry) {
      await get().stop()
    }
    const entry = await window.api.timeEntries.start(taskId)
    const intervalId = startTicking(set, get)
    set({ activeEntry: entry, elapsedSeconds: 0, intervalId })
  },

  stop: async () => {
    const { activeEntry, intervalId } = get()
    if (!activeEntry) return
    if (intervalId) clearInterval(intervalId)
    set({ activeEntry: null, elapsedSeconds: 0, intervalId: null })

    const { task } = await window.api.timeEntries.stop(activeEntry.id)
    if (task) {
      useTasksStore.setState({
        tasks: useTasksStore.getState().tasks.map((t) => (t.id === task.id ? task : t))
      })
    }
  },

  reset: () => {
    const { intervalId } = get()
    if (intervalId) clearInterval(intervalId)
    set({ activeEntry: null, elapsedSeconds: 0, intervalId: null })
  }
}))
