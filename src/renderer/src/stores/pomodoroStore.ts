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
  phaseStartedAt: number | null
  start: () => void
  pause: () => void
  reset: () => void
  startForTask: (taskId: string) => void
  linkTask: (taskId: string | null) => void
}

export const usePomodoroStore = create<PomodoroState>((set, get) => {
  const tick = (): void => {
    const config = useSettingsStore.getState().settings.pomodoro
    const { phaseStartedAt, phase, cyclesCompleted } = get()

    if (!phaseStartedAt) return

    const totalDuration = phaseDuration(phase, config)
    const elapsed = Math.floor((Date.now() - phaseStartedAt) / 1000)
    const remaining = Math.max(0, totalDuration - elapsed)

    if (remaining > 0) {
      set({ remainingSeconds: remaining })
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

    set({
      phase: nextPhase,
      remainingSeconds: phaseDuration(nextPhase, config),
      cyclesCompleted: nextCycles,
      phaseStartedAt: Date.now()
    })
  }

  return {
    phase: 'work',
    remainingSeconds: phaseDuration('work', useSettingsStore.getState().settings.pomodoro),
    isRunning: false,
    cyclesCompleted: 0,
    intervalId: null,
    linkedTaskId: null,
    phaseStartedAt: null,

    start: () => {
      if (get().isRunning) return
      const { linkedTaskId, remainingSeconds, phase } = get()
      const config = useSettingsStore.getState().settings.pomodoro

      // Resume time tracking if a task is linked but not currently tracked
      if (linkedTaskId && !useTimerStore.getState().activeEntry) {
        void useTimerStore.getState().start(linkedTaskId)
      }

      // Calculate phaseStartedAt adjusted for already-elapsed time (resume from pause)
      const totalDuration = phaseDuration(phase, config)
      const phaseStartedAt = Date.now() - (totalDuration - remainingSeconds) * 1000

      const intervalId = setInterval(tick, 1000)
      set({ isRunning: true, intervalId, phaseStartedAt })
    },

    pause: () => {
      const { intervalId, linkedTaskId } = get()
      if (intervalId) clearInterval(intervalId)
      set({ isRunning: false, intervalId: null, phaseStartedAt: null })
      if (linkedTaskId && isTrackingTask(linkedTaskId)) {
        void useTimerStore.getState().stop()
      }
    },

    reset: () => {
      const { intervalId, linkedTaskId } = get()
      if (intervalId) clearInterval(intervalId)
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
        linkedTaskId: null,
        phaseStartedAt: null
      })
    },

    startForTask: (taskId: string) => {
      const { phase } = get()
      const config = useSettingsStore.getState().settings.pomodoro
      set({ linkedTaskId: taskId })
      void useTimerStore.getState().start(taskId)
      if (!get().isRunning) {
        const totalDuration = phaseDuration(phase, config)
        const { remainingSeconds } = get()
        const phaseStartedAt = Date.now() - (totalDuration - remainingSeconds) * 1000
        const intervalId = setInterval(tick, 1000)
        set({ isRunning: true, intervalId, phaseStartedAt })
      }
    },

    linkTask: (taskId: string | null) => {
      const { linkedTaskId: prev, isRunning } = get()
      if (prev && isTrackingTask(prev)) {
        void useTimerStore.getState().stop()
      }
      set({ linkedTaskId: taskId })
      if (taskId && isRunning) {
        void useTimerStore.getState().start(taskId)
      }
    }
  }
})
