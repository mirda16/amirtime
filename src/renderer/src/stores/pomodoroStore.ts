import { create } from 'zustand'
import type { PomodoroSettings } from '@shared/types'
import i18n from '../i18n'
import { useSettingsStore } from './settingsStore'
import { useTimerStore } from './timerStore'

export type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak'

function phaseDuration(phase: PomodoroPhase, config: PomodoroSettings): number {
  switch (phase) {
    case 'work':
      return config.workMinutes * 60
    case 'shortBreak':
      return config.shortBreakMinutes * 60
    case 'longBreak':
      return config.longBreakMinutes * 60
  }
}

function isTrackingTask(taskId: string): boolean {
  return useTimerStore.getState().activeEntry?.taskId === taskId
}

interface PomodoroState {
  phase: PomodoroPhase
  remainingSeconds: number
  isRunning: boolean
  cyclesCompleted: number
  intervalId: ReturnType<typeof setInterval> | null
  linkedTaskId: string | null
  start: () => void
  pause: () => void
  reset: () => void
  startForTask: (taskId: string) => void
  linkTask: (taskId: string | null) => void
}

export const usePomodoroStore = create<PomodoroState>((set, get) => {
  const tick = (): void => {
    const config = useSettingsStore.getState().settings.pomodoro
    const { remainingSeconds, phase, cyclesCompleted } = get()

    if (remainingSeconds > 1) {
      set({ remainingSeconds: remainingSeconds - 1 })
      return
    }

    let nextPhase: PomodoroPhase
    let nextCycles = cyclesCompleted
    let notificationBody: string

    if (phase === 'work') {
      nextCycles = cyclesCompleted + 1
      nextPhase = nextCycles % config.cyclesBeforeLongBreak === 0 ? 'longBreak' : 'shortBreak'
      notificationBody = i18n.t('pomodoro.notificationWorkDone')
    } else {
      nextPhase = 'work'
      notificationBody = i18n.t('pomodoro.notificationBreakDone')
    }

    void window.api.notifications.show({
      title: i18n.t('pomodoro.notificationTitle'),
      body: notificationBody
    })

    // Time tracking keeps running through phase changes (breaks count too)
    set({
      phase: nextPhase,
      remainingSeconds: phaseDuration(nextPhase, config),
      cyclesCompleted: nextCycles
    })
  }

  return {
    phase: 'work',
    remainingSeconds: phaseDuration('work', useSettingsStore.getState().settings.pomodoro),
    isRunning: false,
    cyclesCompleted: 0,
    intervalId: null,
    linkedTaskId: null,

    start: () => {
      if (get().isRunning) return
      const { linkedTaskId } = get()
      // Resume time tracking if a task is linked but not currently tracked
      if (linkedTaskId && !useTimerStore.getState().activeEntry) {
        void useTimerStore.getState().start(linkedTaskId)
      }
      const intervalId = setInterval(tick, 1000)
      set({ isRunning: true, intervalId })
    },

    pause: () => {
      const { intervalId, linkedTaskId } = get()
      if (intervalId) clearInterval(intervalId)
      set({ isRunning: false, intervalId: null })
      // Stop time tracking on pause
      if (linkedTaskId && isTrackingTask(linkedTaskId)) {
        void useTimerStore.getState().stop()
      }
    },

    reset: () => {
      const { intervalId, linkedTaskId } = get()
      if (intervalId) clearInterval(intervalId)
      // Stop time tracking on reset
      if (linkedTaskId && isTrackingTask(linkedTaskId)) {
        void useTimerStore.getState().stop()
      }
      const config = useSettingsStore.getState().settings.pomodoro
      set({
        phase: 'work',
        remainingSeconds: phaseDuration('work', config),
        isRunning: false,
        cyclesCompleted: 0,
        intervalId: null,
        linkedTaskId: null
      })
    },

    startForTask: (taskId: string) => {
      set({ linkedTaskId: taskId })
      // Start time tracking (timerStore.start handles stopping any previous entry)
      void useTimerStore.getState().start(taskId)
      if (!get().isRunning) {
        const intervalId = setInterval(tick, 1000)
        set({ isRunning: true, intervalId })
      }
    },

    linkTask: (taskId: string | null) => {
      const { linkedTaskId: prev, isRunning } = get()
      // Stop tracking the previous task
      if (prev && isTrackingTask(prev)) {
        void useTimerStore.getState().stop()
      }
      set({ linkedTaskId: taskId })
      // If pomodoro is running, immediately start tracking the new task
      if (taskId && isRunning) {
        void useTimerStore.getState().start(taskId)
      }
    }
  }
})
