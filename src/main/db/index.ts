import path from 'node:path'
import { app } from 'electron'
import Database from 'better-sqlite3'
import migration001 from './migrations/001_init.sql?raw'
import migration002 from './migrations/002_task_extras.sql?raw'
import migration003 from './migrations/003_subtasks.sql?raw'
import migration004 from './migrations/004_kanban.sql?raw'

interface Migration {
  version: number
  sql: string
}

const MIGRATIONS: Migration[] = [
  { version: 1, sql: migration001 },
  { version: 2, sql: migration002 },
  { version: 3, sql: migration003 },
  { version: 4, sql: migration004 }
]

export const CURRENT_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database has not been initialized yet')
  }
  return db
}

export function initDb(): Database.Database {
  const dbPath = path.join(app.getPath('userData'), 'amirtime.db')
  const instance = new Database(dbPath)
  instance.pragma('journal_mode = WAL')
  instance.pragma('foreign_keys = ON')

  instance.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `)

  const appliedVersions = new Set(
    (instance.prepare('SELECT version FROM schema_migrations').all() as { version: number }[]).map(
      (row) => row.version
    )
  )

  for (const migration of MIGRATIONS) {
    if (appliedVersions.has(migration.version)) continue

    const applyMigration = instance.transaction(() => {
      instance.exec(migration.sql)
      instance
        .prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)')
        .run(migration.version, new Date().toISOString())
    })
    applyMigration()
  }

  db = instance
  return instance
}
