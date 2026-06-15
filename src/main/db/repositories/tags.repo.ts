import { randomUUID } from 'node:crypto'
import { getDb } from '../index'
import type { CreateTagInput, Tag, UpdateTagInput } from '@shared/types'

interface TagRow {
  id: string
  name: string
  color: string | null
  created_at: string
  updated_at: string
}

function mapRow(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export const tagsRepo = {
  getAll(): Tag[] {
    const rows = getDb().prepare('SELECT * FROM tags ORDER BY name ASC').all() as TagRow[]
    return rows.map(mapRow)
  },

  create(input: CreateTagInput): Tag {
    const db = getDb()
    const now = new Date().toISOString()
    const id = randomUUID()
    db.prepare(
      `INSERT INTO tags (id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
    ).run(id, input.name, input.color ?? null, now, now)
    return mapRow(db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as TagRow)
  },

  update(id: string, patch: UpdateTagInput): Tag {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as TagRow | undefined
    if (!existing) throw new Error(`Tag not found: ${id}`)

    const now = new Date().toISOString()
    db.prepare('UPDATE tags SET name = ?, color = ?, updated_at = ? WHERE id = ?').run(
      patch.name ?? existing.name,
      patch.color !== undefined ? patch.color : existing.color,
      now,
      id
    )

    return mapRow(db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as TagRow)
  },

  delete(id: string): void {
    getDb().prepare('DELETE FROM tags WHERE id = ?').run(id)
  }
}
