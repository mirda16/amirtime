import { create } from 'zustand'
import { DEFAULT_SETTINGS, type AppSettings, type PomodoroSettings } from '@shared/types'
import i18n from '../i18n'

interface SettingsState {
  settings: AppSettings
  isLoaded: boolean
  loadSettings: () => Promise<void>
  setLanguage: (language: string) => Promise<void>
  setTheme: (theme: AppSettings['theme']) => Promise<void>
  setPomodoroSettings: (pomodoro: PomodoroSettings) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: async () => {
    const settings = await window.api.settings.getAll()
    set({ settings, isLoaded: true })
    await i18n.changeLanguage(settings.language)
  },

  setLanguage: async (language) => {
    set({ settings: { ...get().settings, language } })
    await window.api.settings.set('language', language)
    await i18n.changeLanguage(language)
  },

  setTheme: async (theme) => {
    set({ settings: { ...get().settings, theme } })
    await window.api.settings.set('theme', theme)
  },

  setPomodoroSettings: async (pomodoro) => {
    set({ settings: { ...get().settings, pomodoro } })
    await window.api.settings.set('pomodoro', pomodoro)
  }
}))
