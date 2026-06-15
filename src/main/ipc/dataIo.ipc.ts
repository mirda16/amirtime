import { readFileSync, writeFileSync } from 'node:fs'
import { BrowserWindow, dialog, ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type { ExportData, ExportResult, ImportResult } from '@shared/types'
import { CURRENT_SCHEMA_VERSION } from '../db'
import { dataIoRepo } from '../db/repositories/dataIo.repo'

const EXPORT_TABLE_KEYS = ['projects', 'tags', 'tasks', 'taskTags', 'timeEntries', 'settings']

function isExportData(value: unknown): value is ExportData {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string, unknown>
  if (typeof data.schemaVersion !== 'number') return false
  if (!data.tables || typeof data.tables !== 'object') return false
  const tables = data.tables as Record<string, unknown>
  return EXPORT_TABLE_KEYS.every((key) => Array.isArray(tables[key]))
}

export function registerDataIoIpc(): void {
  ipcMain.handle(IpcChannels.dataIoExportAll, async (event): Promise<ExportResult> => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const options: Electron.SaveDialogOptions = {
      title: 'Export data',
      defaultPath: `amirtime-export-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    }
    const result = window
      ? await dialog.showSaveDialog(window, options)
      : await dialog.showSaveDialog(options)
    if (result.canceled || !result.filePath) return { canceled: true }

    const data = dataIoRepo.exportAll()
    writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8')
    return { canceled: false, filePath: result.filePath }
  })

  ipcMain.handle(IpcChannels.dataIoImportAll, async (event): Promise<ImportResult> => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const options: Electron.OpenDialogOptions = {
      title: 'Import data',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    }
    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options)
    if (result.canceled || result.filePaths.length === 0) return { canceled: true }

    try {
      const raw = readFileSync(result.filePaths[0], 'utf-8')
      const data = JSON.parse(raw) as unknown
      if (!isExportData(data) || data.schemaVersion > CURRENT_SCHEMA_VERSION) {
        return { canceled: false, success: false, error: 'invalidFile' }
      }
      dataIoRepo.importAll(data)
      return { canceled: false, success: true }
    } catch {
      return { canceled: false, success: false, error: 'invalidFile' }
    }
  })
}
