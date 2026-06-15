import { randomUUID } from 'node:crypto'
import { getDb } from '../index'
import type { TimeEntry, TimeEntryType } from '@shared/types'

interface TimeEntryRow {
  id: string
  task_id: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  type: string
  note: string | null
  created_at: string
  updated_at: string
}

function mapRow(row: TimeEntryRow): TimeEntry {
  return {
    id: row.id,
    taskId: row.task_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds,
    type: row.type as TimeEntryType,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export const timeEntriesRepo = {
  getActive(): TimeEntry | null {
    const row = getDb()
      .prepare('SELECT * FROM time_entries WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1')
      .get() as TimeEntryRow | undefined
    return row ? mapRow(row) : null
  },

  start(taskId: string, type: TimeEntryType = 'manual'): TimeEntry {
    const db = getDb()
    const now = new Date().toISOString()
    const id = randomUUID()
    db.prepare(
      `INSERT INTO time_entries (id, task_id, started_at, type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, taskId, now, type, now, now)
    return mapRow(db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id) as TimeEntryRow)
  },

  stop(entryId: string): TimeEntry {
    const db = getDb()
    const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(entryId) as
      | TimeEntryRow
      | undefined
    if (!entry) throw new Error(`Time entry not found: ${entryId}`)
    if (entry.ended_at) return mapRow(entry)

    const now = new Date().toISOString()
    const durationSeconds = Math.max(
      0,
      Math.round((Date.parse(now) - Date.parse(entry.started_at)) / 1000)
    )

    const applyStop = db.transaction(() => {
      db.prepare(
        'UPDATE time_entries SET ended_at = ?, duration_seconds = ?, updated_at = ? WHERE id = ?'
      ).run(now, durationSeconds, now, entryId)
      db.prepare(
        'UPDATE tasks SET time_spent_seconds = time_spent_seconds + ?, updated_at = ? WHERE id = ?'
      ).run(durationSeconds, now, entry.task_id)
    })
    applyStop()

    return mapRow(db.prepare('SELECT * FROM time_entries WHERE id = ?').get(entryId) as TimeEntryRow)
  }
}
