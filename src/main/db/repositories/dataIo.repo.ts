import { getDb, CURRENT_SCHEMA_VERSION } from '../index'
import type { ExportData } from '@shared/types'

const TABLES: { key: keyof ExportData['tables']; table: string }[] = [
  { key: 'projects', table: 'projects' },
  { key: 'tags', table: 'tags' },
  { key: 'tasks', table: 'tasks' },
  { key: 'taskTags', table: 'task_tags' },
  { key: 'timeEntries', table: 'time_entries' },
  { key: 'settings', table: 'settings' }
]

export const dataIoRepo = {
  exportAll(): ExportData {
    const db = getDb()
    const tables = {} as ExportData['tables']
    for (const { key, table } of TABLES) {
      tables[key] = db.prepare(`SELECT * FROM ${table}`).all() as Record<string, unknown>[]
    }
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      tables
    }
  },

  importAll(data: ExportData): void {
    const db = getDb()

    const runImport = db.transaction(() => {
      for (const { table } of [...TABLES].reverse()) {
        db.prepare(`DELETE FROM ${table}`).run()
      }
      for (const { key, table } of TABLES) {
        for (const row of data.tables[key]) {
          const columns = Object.keys(row)
          if (columns.length === 0) continue
          const placeholders = columns.map(() => '?').join(', ')
          db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`).run(
            ...columns.map((c) => row[c])
          )
        }
      }
    })

    runImport()
  }
}
