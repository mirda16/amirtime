import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import { settingsRepo } from '../db/repositories/settings.repo'
import type { AppSettings } from '@shared/types'

export function registerSettingsIpc(): void {
  ipcMain.handle(IpcChannels.settingsGetAll, () => settingsRepo.getAll())

  ipcMain.handle(
    IpcChannels.settingsSet,
    <K extends keyof AppSettings>(_event: unknown, key: K, value: AppSettings[K]) =>
      settingsRepo.set(key, value)
  )
}
