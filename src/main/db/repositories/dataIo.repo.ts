import { getDb, CURRENT_SCHEMA_VERSION } from '../index'
import type { ExportData } from '@shared/types'

const TABLES: { key: keyof ExportData['tables']; table: string }[] = [
  { key: 'projects', table: 'projects' },
  { key: 'tags', table: 'tags' },
  { key: 'tasks', table: 'tasks' },
  { key: 'taskTags', table: 'task_tags' },
  { key: 'subtasks', table: 'subtasks' },
  { key: 'timeEntries', table: 'time_entries' },
  { key: 'settings', table: 'settings' }
]

// Tables deleted in reverse order to respect FK constraints
const DELETE_ORDER = ['settings', 'time_entries', 'subtasks', 'task_tags', 'tasks', 'tags', 'projects']

function upsertRows(
  db: ReturnType<typeof getDb>,
  table: string,
  rows: Record<string, unknown>[],
  timestampCol: string
): Set<string> {
  const updated = new Set<string>()
  for (const row of rows) {
    const cols = Object.keys(row)
    if (cols.length === 0) continue
    const placeholders = cols.map(() => '?').join(', ')
    const setClauses = cols.filter((c) => c !== 'id').map((c) => `${c} = excluded.${c}`).join(', ')
    const result = db
      .prepare(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})
         ON CONFLICT(id) DO UPDATE SET ${setClauses}
         WHERE excluded.${timestampCol} > ${table}.${timestampCol}`
      )
      .run(...cols.map((c) => row[c]))
    if (result.changes > 0) updated.add(row.id as string)
  }
  return updated
}

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
      for (const tableName of DELETE_ORDER) {
        db.prepare(`DELETE FROM ${tableName}`).run()
      }
      for (const { key, table } of TABLES) {
        const rows = data.tables[key] ?? []
        for (const row of rows) {
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
  },

  mergeImport(data: ExportData): void {
    const db = getDb()

    const runMerge = db.transaction(() => {
      // Upsert projects, tags — last updated_at wins
      upsertRows(db, 'projects', data.tables.projects, 'updated_at')
      upsertRows(db, 'tags', data.tables.tags, 'updated_at')

      // Tasks — track which IDs won so we can update their task_tags
      const updatedTaskIds = upsertRows(db, 'tasks', data.tables.tasks, 'updated_at')

      // task_tags: replace tags only for tasks that got updated
      if (updatedTaskIds.size > 0) {
        for (const taskId of updatedTaskIds) {
          db.prepare('DELETE FROM task_tags WHERE task_id = ?').run(taskId)
        }
        for (const row of data.tables.taskTags) {
          if (updatedTaskIds.has(row.task_id as string)) {
            db.prepare('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)').run(
              row.task_id,
              row.tag_id
            )
          }
        }
      }

      // Subtasks and time entries
      upsertRows(db, 'subtasks', data.tables.subtasks ?? [], 'updated_at')
      upsertRows(db, 'time_entries', data.tables.timeEntries, 'updated_at')

      // Settings are device-specific — skip
    })

    runMerge()
  }
}
