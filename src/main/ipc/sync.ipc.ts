import { BrowserWindow, dialog, ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import { syncService } from '../sync/syncService'

export function registerSyncIpc(): void {
  ipcMain.handle(IpcChannels.syncGetPath, () => syncService.getPath())

  // Create a NEW sync file (SaveDialog — user picks location for a file that doesn't exist yet)
  ipcMain.handle(IpcChannels.syncSelectPath, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const options: Electron.SaveDialogOptions = {
      title: 'Vytvořit nový sync soubor',
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

  // Connect to an EXISTING sync file from another device (OpenDialog — file must already exist)
  ipcMain.handle(IpcChannels.syncConnectPath, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const options: Electron.OpenDialogOptions = {
      title: 'Připojit ke sync souboru',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    }
    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options)
    if (result.canceled || !result.filePaths[0]) return null
    syncService.setPath(result.filePaths[0])
    return result.filePaths[0]
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
