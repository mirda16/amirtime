import { create } from 'zustand'
import type { TimeEntry } from '@shared/types'
import i18n from '../i18n'
import { formatDuration } from '../utils/formatDuration'
import { useSettingsStore } from './settingsStore'
import { useTasksStore } from './tasksStore'

const AUTO_STOP_DELAY_MS = 5 * 60 * 1000

interface TimerState {
  activeEntry: TimeEntry | null
  elapsedSeconds: number
  intervalId: ReturnType<typeof setInterval> | null
  reminderSentAt: number | null
  autoStopTimeoutId: ReturnType<typeof setTimeout> | null
  init: () => Promise<void>
  start: (taskId: string) => Promise<void>
  stop: () => Promise<void>
  reset: () => void
  dismissReminder: () => void
}

function secondsSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
}

function startTicking(
  set: (partial: Partial<TimerState>) => void,
  get: () => TimerState
): ReturnType<typeof setInterval> {
  return setInterval(() => {
    const entry = get().activeEntry
    if (!entry) return

    const elapsed = secondsSince(entry.startedAt)
    set({ elapsedSeconds: elapsed })

    const { reminderSentAt } = get()
    if (reminderSentAt) return

    const { timerReminderHours } = useSettingsStore.getState().settings
    const thresholdSeconds = timerReminderHours * 3600
    if (thresholdSeconds <= 0 || elapsed < thresholdSeconds) return

    void window.api.notifications.show({
      title: i18n.t('timer.reminderTitle'),
      body: i18n.t('timer.reminderBody', { time: formatDuration(elapsed) })
    })

    const autoStopTimeoutId = setTimeout(() => {
      void get().stop()
    }, AUTO_STOP_DELAY_MS)

    set({ reminderSentAt: Date.now(), autoStopTimeoutId })
  }, 1000)
}

export const useTimerStore = create<TimerState>((set, get) => ({
  activeEntry: null,
  elapsedSeconds: 0,
  intervalId: null,
  reminderSentAt: null,
  autoStopTimeoutId: null,

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
    set({ activeEntry: entry, elapsedSeconds: 0, intervalId, reminderSentAt: null, autoStopTimeoutId: null })
  },

  stop: async () => {
    const { activeEntry, intervalId, autoStopTimeoutId } = get()
    if (!activeEntry) return
    if (intervalId) clearInterval(intervalId)
    if (autoStopTimeoutId) clearTimeout(autoStopTimeoutId)
    set({ activeEntry: null, elapsedSeconds: 0, intervalId: null, reminderSentAt: null, autoStopTimeoutId: null })

    const { task } = await window.api.timeEntries.stop(activeEntry.id)
    if (task) {
      useTasksStore.setState({
        tasks: useTasksStore.getState().tasks.map((t) => (t.id === task.id ? task : t))
      })
    }
  },

  reset: () => {
    const { intervalId, autoStopTimeoutId } = get()
    if (intervalId) clearInterval(intervalId)
    if (autoStopTimeoutId) clearTimeout(autoStopTimeoutId)
    set({ activeEntry: null, elapsedSeconds: 0, intervalId: null, reminderSentAt: null, autoStopTimeoutId: null })
  },

  dismissReminder: () => {
    const { autoStopTimeoutId } = get()
    if (autoStopTimeoutId) clearTimeout(autoStopTimeoutId)
    set({ reminderSentAt: null, autoStopTimeoutId: null })
  }
}))
