import { randomUUID } from 'node:crypto'
import type Database from 'better-sqlite3'
import { getDb } from '../index'
import type { CreateTaskInput, Task, TaskFilter, TaskPriority, UpdateTaskInput } from '@shared/types'
import { subtasksRepo } from './subtasks.repo'

interface TaskRow {
  id: string
  title: string
  description: string | null
  project_id: string | null
  color: string | null
  priority: string
  is_done: number
  done_at: string | null
  due_date: string | null
  scheduled_at: string | null
  scheduled_end: string | null
  time_estimate_minutes: number | null
  time_spent_seconds: number
  sort_order: number
  created_at: string
  updated_at: string
}

function mapRow(row: TaskRow, tagIds: string[]): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    projectId: row.project_id,
    color: row.color,
    priority: row.priority as TaskPriority,
    isDone: !!row.is_done,
    doneAt: row.done_at,
    dueDate: row.due_date,
    scheduledAt: row.scheduled_at,
    scheduledEnd: row.scheduled_end,
    timeEstimateMinutes: row.time_estimate_minutes,
    timeSpentSeconds: row.time_spent_seconds,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tagIds,
    subtasks: subtasksRepo.getByTaskId(row.id)
  }
}

function getTagIds(db: Database.Database, taskId: string): string[] {
  return (
    db.prepare('SELECT tag_id FROM task_tags WHERE task_id = ?').all(taskId) as {
      tag_id: string
    }[]
  ).map((row) => row.tag_id)
}

function setTagsInternal(db: Database.Database, taskId: string, tagIds: string[]): void {
  const applyTags = db.transaction((ids: string[]) => {
    db.prepare('DELETE FROM task_tags WHERE task_id = ?').run(taskId)
    const insert = db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)')
    for (const tagId of ids) {
      insert.run(taskId, tagId)
    }
  })
  applyTags(tagIds)
}

export const tasksRepo = {
  getAll(filter?: TaskFilter): Task[] {
    const db = getDb()
    const params: unknown[] = []
    let sql = 'SELECT t.* FROM tasks t'
    const conditions: string[] = []

    if (filter?.tagId) {
      sql += ' INNER JOIN task_tags tt ON tt.task_id = t.id'
      conditions.push('tt.tag_id = ?')
      params.push(filter.tagId)
    }
    if (filter?.projectId) {
      conditions.push('t.project_id = ?')
      params.push(filter.projectId)
    }
    if (!filter?.includeDone) {
      conditions.push('t.is_done = 0')
    }
    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }
    sql += ' ORDER BY t.sort_order ASC, t.created_at ASC'

    const rows = db.prepare(sql).all(...params) as TaskRow[]
    return rows.map((row) => mapRow(row, getTagIds(db, row.id)))
  },

  getById(id: string): Task | null {
    const db = getDb()
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined
    if (!row) return null
    return mapRow(row, getTagIds(db, id))
  },

  create(input: CreateTaskInput): Task {
    const db = getDb()
    const now = new Date().toISOString()
    const id = randomUUID()
    const { m: maxOrder } = db
      .prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM tasks')
      .get() as { m: number }

    db.prepare(
      `INSERT INTO tasks (
        id, title, description, project_id, color, priority, is_done,
        due_date, time_estimate_minutes, sort_order, time_spent_seconds, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 0, ?, ?)`
    ).run(
      id,
      input.title,
      input.description ?? null,
      input.projectId ?? null,
      input.color ?? null,
      input.priority ?? 'none',
      input.dueDate ?? null,
      input.timeEstimateMinutes ?? null,
      maxOrder + 1,
      now,
      now
    )

    if (input.tagIds?.length) {
      setTagsInternal(db, id, input.tagIds)
    }

    return this.getById(id) as Task
  },

  update(id: string, patch: UpdateTaskInput): Task {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as
      | TaskRow
      | undefined
    if (!existing) throw new Error(`Task not found: ${id}`)

    const now = new Date().toISOString()
    const isDone = patch.isDone !== undefined ? patch.isDone : !!existing.is_done
    const doneAt =
      patch.isDone !== undefined ? (patch.isDone ? now : null) : existing.done_at

    db.prepare(
      `UPDATE tasks SET
        title = ?, description = ?, project_id = ?, color = ?, priority = ?, is_done = ?, done_at = ?,
        due_date = ?, scheduled_at = ?, scheduled_end = ?, time_estimate_minutes = ?,
        sort_order = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      patch.title ?? existing.title,
      patch.description !== undefined ? patch.description : existing.description,
      patch.projectId !== undefined ? patch.projectId : existing.project_id,
      patch.color !== undefined ? patch.color : existing.color,
      patch.priority ?? existing.priority,
      isDone ? 1 : 0,
      doneAt,
      patch.dueDate !== undefined ? patch.dueDate : existing.due_date,
      patch.scheduledAt !== undefined ? patch.scheduledAt : existing.scheduled_at,
      patch.scheduledEnd !== undefined ? patch.scheduledEnd : existing.scheduled_end,
      patch.timeEstimateMinutes !== undefined
        ? patch.timeEstimateMinutes
        : existing.time_estimate_minutes,
      patch.sortOrder !== undefined ? patch.sortOrder : existing.sort_order,
      now,
      id
    )

    if (patch.tagIds !== undefined) {
      setTagsInternal(db, id, patch.tagIds)
    }

    return this.getById(id) as Task
  },

  delete(id: string): void {
    getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id)
  },

  setTags(taskId: string, tagIds: string[]): Task {
    const db = getDb()
    setTagsInternal(db, taskId, tagIds)
    db.prepare('UPDATE tasks SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), taskId)
    return this.getById(taskId) as Task
  },

  reorder(orderedIds: string[]): void {
    const db = getDb()
    const now = new Date().toISOString()
    const stmt = db.prepare('UPDATE tasks SET sort_order = ?, updated_at = ? WHERE id = ?')
    const applyReorder = db.transaction((ids: string[]) => {
      ids.forEach((id, index) => stmt.run(index, now, id))
    })
    applyReorder(orderedIds)
  }
}
