import { create } from 'zustand'
import type { PomodoroSettings } from '@shared/types'
import i18n from '../i18n'
import { useSettingsStore } from './settingsStore'

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

interface PomodoroState {
  phase: PomodoroPhase
  remainingSeconds: number
  isRunning: boolean
  cyclesCompleted: number
  intervalId: ReturnType<typeof setInterval> | null
  start: () => void
  pause: () => void
  reset: () => void
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

    start: () => {
      if (get().isRunning) return
      const intervalId = setInterval(tick, 1000)
      set({ isRunning: true, intervalId })
    },

    pause: () => {
      const { intervalId } = get()
      if (intervalId) clearInterval(intervalId)
      set({ isRunning: false, intervalId: null })
    },

    reset: () => {
      const { intervalId } = get()
      if (intervalId) clearInterval(intervalId)
      const config = useSettingsStore.getState().settings.pomodoro
      set({
        phase: 'work',
        remainingSeconds: phaseDuration('work', config),
        isRunning: false,
        cyclesCompleted: 0,
        intervalId: null
      })
    }
  }
})
