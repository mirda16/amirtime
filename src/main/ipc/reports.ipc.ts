import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import { reportsRepo } from '../db/repositories/reports.repo'

export function registerReportsIpc(): void {
  ipcMain.handle(IpcChannels.reportsGetSummary, (_event, from: string, to: string) =>
    reportsRepo.getSummary(from, to)
  )
}
