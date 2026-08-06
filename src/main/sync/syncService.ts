import { existsSync, readFileSync, watch, writeFileSync, FSWatcher } from 'node:fs'
import path from 'node:path'
import { app, BrowserWindow } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type { ExportData } from '@shared/types'
import { CURRENT_SCHEMA_VERSION } from '../db'
import { dataIoRepo } from '../db/repositories/dataIo.repo'

const REQUIRED_TABLE_KEYS = ['projects', 'tags', 'tasks', 'taskTags', 'timeEntries', 'settings']

function isValidSyncData(value: unknown): value is ExportData {
  if (!value || typeof value !== 'object') return false
  const d = value as Record<string, unknown>
  if (typeof d.schemaVersion !== 'number' || d.schemaVersion > CURRENT_SCHEMA_VERSION) return false
  if (!d.tables || typeof d.tables !== 'object') return false
  const t = d.tables as Record<string, unknown>
  return REQUIRED_TABLE_KEYS.every((k) => Array.isArray(t[k]))
}

interface SyncConfig {
  filePath: string | null
}

class SyncService {
  private filePath: string | null = null
  private configPath: string
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private watcher: FSWatcher | null = null
  private isExporting = false

  constructor() {
    this.configPath = path.join(app.getPath('userData'), 'sync-config.json')
    this.loadConfig()
  }

  private loadConfig(): void {
    try {
      const raw = readFileSync(this.configPath, 'utf-8')
      const config = JSON.parse(raw) as SyncConfig
      if (config.filePath) {
        this.filePath = config.filePath
        this.startWatcher()
        // Import on startup so changes from other devices made while this app was
        // closed are picked up immediately (mergeImport uses updated_at, so it is
        // safe even when our local data is already newer).
        if (existsSync(this.filePath)) {
          this.importNow()
        }
      }
    } catch {
      // no config yet
    }
  }

  private saveConfig(): void {
    writeFileSync(this.configPath, JSON.stringify({ filePath: this.filePath }, null, 2), 'utf-8')
  }

  getPath(): string | null {
    return this.filePath
  }

  /**
   * Set sync path and decide the initial action:
   *  - file already exists → merge-import from it (connect to another device's data)
   *  - file does not exist → export our data to create it (first-time setup)
   */
  setPath(filePath: string | null): void {
    this.stopWatcher()
    this.filePath = filePath
    this.saveConfig()
    if (filePath) {
      this.startWatcher()
      if (existsSync(filePath)) {
        // Connect to an existing sync file — import first, don't overwrite
        this.importNow()
      } else {
        // New sync file — export our data to initialise it
        this.exportNow()
      }
    }
  }

  scheduleExport(): void {
    if (!this.filePath) return
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.debounceTimer = setTimeout(() => this.exportNow(), 3000)
  }

  exportNow(): void {
    if (!this.filePath) return
    try {
      this.isExporting = true
      const data = dataIoRepo.exportAll()
      writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (e) {
      console.error('[Sync] Export failed:', e)
    } finally {
      // Keep flag set long enough to ignore the watcher event triggered by our own write
      setTimeout(() => {
        this.isExporting = false
      }, 1500)
    }
  }

  importNow(): boolean {
    if (!this.filePath || !existsSync(this.filePath)) return false
    try {
      const raw = readFileSync(this.filePath, 'utf-8')
      const data = JSON.parse(raw) as unknown
      if (!isValidSyncData(data)) return false
      dataIoRepo.mergeImport(data)
      this.notifyRenderer()
      return true
    } catch (e) {
      console.error('[Sync] Import failed:', e)
      return false
    }
  }

  private startWatcher(): void {
    if (!this.filePath) return
    const dir = path.dirname(this.filePath)
    const filename = path.basename(this.filePath)
    try {
      this.watcher = watch(dir, (_, changedFile) => {
        if (changedFile !== filename) return
        if (this.isExporting) return
        // Debounce to let the external write fully finish
        setTimeout(() => {
          if (!this.isExporting) this.importNow()
        }, 800)
      })
    } catch (e) {
      console.error('[Sync] Failed to watch directory:', e)
    }
  }

  private stopWatcher(): void {
    this.watcher?.close()
    this.watcher = null
  }

  private notifyRenderer(): void {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send(IpcChannels.syncDataChanged)
    })
  }

  dispose(): void {
    this.stopWatcher()
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
  }
}

export const syncService = new SyncService()
