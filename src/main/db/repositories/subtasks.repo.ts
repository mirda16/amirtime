import { randomUUID } from 'node:crypto'
import { getDb } from '../index'
import type { CreateSubtaskInput, Subtask, UpdateSubtaskInput } from '@shared/types'

interface SubtaskRow {
  id: string
  task_id: string
  title: string
  is_done: number
  sort_order: number
  created_at: string
  updated_at: string
}

function mapRow(row: SubtaskRow): Subtask {
  return {
    id: row.id,
    taskId: row.task_id,
    title: row.title,
    isDone: !!row.is_done,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export const subtasksRepo = {
  getByTaskId(taskId: string): Subtask[] {
    const rows = getDb()
      .prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY sort_order ASC, created_at ASC')
      .all(taskId) as SubtaskRow[]
    return rows.map(mapRow)
  },

  create(taskId: string, input: CreateSubtaskInput): Subtask {
    const db = getDb()
    const now = new Date().toISOString()
    const id = randomUUID()
    const { m: maxOrder } = db
      .prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM subtasks WHERE task_id = ?')
      .get(taskId) as { m: number }
    db.prepare(
      'INSERT INTO subtasks (id, task_id, title, is_done, sort_order, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?, ?)'
    ).run(id, taskId, input.title, maxOrder + 1, now, now)
    return mapRow(db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id) as SubtaskRow)
  },

  update(id: string, patch: UpdateSubtaskInput): void {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id) as
      | SubtaskRow
      | undefined
    if (!existing) throw new Error(`Subtask not found: ${id}`)
    const now = new Date().toISOString()
    db.prepare('UPDATE subtasks SET title = ?, is_done = ?, updated_at = ? WHERE id = ?').run(
      patch.title ?? existing.title,
      patch.isDone !== undefined ? (patch.isDone ? 1 : 0) : existing.is_done,
      now,
      id
    )
  },

  delete(id: string): void {
    getDb().prepare('DELETE FROM subtasks WHERE id = ?').run(id)
  }
}
