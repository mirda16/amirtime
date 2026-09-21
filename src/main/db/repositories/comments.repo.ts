import { randomUUID } from 'node:crypto'
import { getDb } from '../index'
import type { CreateCommentInput, TaskComment, UpdateCommentInput } from '@shared/types'

interface CommentRow {
  id: string
  task_id: string
  content: string
  created_at: string
  updated_at: string
}

function mapRow(row: CommentRow): TaskComment {
  return {
    id: row.id,
    taskId: row.task_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export const commentsRepo = {
  getByTaskId(taskId: string): TaskComment[] {
    const rows = getDb()
      .prepare('SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at ASC')
      .all(taskId) as CommentRow[]
    return rows.map(mapRow)
  },

  create(taskId: string, input: CreateCommentInput): TaskComment {
    const db = getDb()
    const now = new Date().toISOString()
    const id = randomUUID()
    db.prepare(
      'INSERT INTO task_comments (id, task_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, taskId, input.content, now, now)
    return mapRow(db.prepare('SELECT * FROM task_comments WHERE id = ?').get(id) as CommentRow)
  },

  update(id: string, patch: UpdateCommentInput): TaskComment {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM task_comments WHERE id = ?').get(id) as CommentRow | undefined
    if (!existing) throw new Error(`Comment not found: ${id}`)
    const now = new Date().toISOString()
    db.prepare('UPDATE task_comments SET content = ?, updated_at = ? WHERE id = ?').run(
      patch.content ?? existing.content,
      now,
      id
    )
    return mapRow(db.prepare('SELECT * FROM task_comments WHERE id = ?').get(id) as CommentRow)
  },

  delete(id: string): void {
    getDb().prepare('DELETE FROM task_comments WHERE id = ?').run(id)
  }
}
