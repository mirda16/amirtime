import { getDb } from '../index'
import { DEFAULT_SETTINGS, type AppSettings, type PomodoroSettings } from '@shared/types'

interface SettingRow {
  key: string
  value: string
}

export const settingsRepo = {
  getAll(): AppSettings {
    const rows = getDb().prepare('SELECT key, value FROM settings').all() as SettingRow[]
    const stored: Partial<Record<keyof AppSettings, unknown>> = {}
    for (const row of rows) {
      stored[row.key as keyof AppSettings] = JSON.parse(row.value)
    }

    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      pomodoro: {
        ...DEFAULT_SETTINGS.pomodoro,
        ...((stored.pomodoro as Partial<PomodoroSettings>) ?? {})
      }
    } as AppSettings
  },

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    getDb()
      .prepare(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`
      )
      .run(key, JSON.stringify(value))
  }
}
