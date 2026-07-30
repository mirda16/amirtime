import { BrowserWindow, dialog, ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import { syncService } from '../sync/syncService'

export function registerSyncIpc(): void {
  ipcMain.handle(IpcChannels.syncGetPath, () => syncService.getPath())

  ipcMain.handle(IpcChannels.syncSelectPath, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const options: Electron.SaveDialogOptions = {
      title: 'Vyberte umístění sync souboru',
      defaultPath: 'amirtime-sync.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    }
    const result = window
      ? await dialog.showSaveDialog(window, options)
      : await dialog.showSaveDialog(options)
    if (result.canceled || !result.filePath) return null
    syncService.setPath(result.filePath)
    return result.filePath
  })

  ipcMain.handle(IpcChannels.syncClearPath, () => {
    syncService.setPath(null)
  })

  ipcMain.handle(IpcChannels.syncExportNow, () => {
    syncService.exportNow()
  })

  ipcMain.handle(IpcChannels.syncImportNow, () => {
    return syncService.importNow()
  })
}
