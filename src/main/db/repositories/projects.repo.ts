import { randomUUID } from 'node:crypto'
import { getDb } from '../index'
import type { CreateProjectInput, Project, UpdateProjectInput } from '@shared/types'

interface ProjectRow {
  id: string
  name: string
  color: string | null
  is_archived: number
  sort_order: number
  created_at: string
  updated_at: string
}

function mapRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    isArchived: !!row.is_archived,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export const projectsRepo = {
  getAll(): Project[] {
    const rows = getDb()
      .prepare('SELECT * FROM projects ORDER BY sort_order ASC, created_at ASC')
      .all() as ProjectRow[]
    return rows.map(mapRow)
  },

  create(input: CreateProjectInput): Project {
    const db = getDb()
    const now = new Date().toISOString()
    const id = randomUUID()
    const { m: maxOrder } = db
      .prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM projects')
      .get() as { m: number }

    db.prepare(
      `INSERT INTO projects (id, name, color, is_archived, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, 0, ?, ?, ?)`
    ).run(id, input.name, input.color ?? null, maxOrder + 1, now, now)

    return mapRow(db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow)
  },

  update(id: string, patch: UpdateProjectInput): Project {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as
      | ProjectRow
      | undefined
    if (!existing) throw new Error(`Project not found: ${id}`)

    const now = new Date().toISOString()
    db.prepare(
      `UPDATE projects SET name = ?, color = ?, is_archived = ?, sort_order = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      patch.name ?? existing.name,
      patch.color !== undefined ? patch.color : existing.color,
      patch.isArchived !== undefined ? (patch.isArchived ? 1 : 0) : existing.is_archived,
      patch.sortOrder !== undefined ? patch.sortOrder : existing.sort_order,
      now,
      id
    )

    return mapRow(db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow)
  },

  delete(id: string): void {
    getDb().prepare('DELETE FROM projects WHERE id = ?').run(id)
  },

  reorder(orderedIds: string[]): void {
    const db = getDb()
    const now = new Date().toISOString()
    const stmt = db.prepare('UPDATE projects SET sort_order = ?, updated_at = ? WHERE id = ?')
    const applyReorder = db.transaction((ids: string[]) => {
      ids.forEach((id, index) => stmt.run(index, now, id))
    })
    applyReorder(orderedIds)
  }
}
