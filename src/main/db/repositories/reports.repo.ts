import dayjs from 'dayjs'
import { getDb } from '../index'
import type { ReportProjectTotal, ReportDayTotal, ReportSummary, ReportTaskTotal } from '@shared/types'

interface EntryRow {
  duration_seconds: number
  started_at: string
  task_id: string
  task_title: string
  project_id: string | null
}

export const reportsRepo = {
  getSummary(fromIso: string, toIso: string): ReportSummary {
    const db = getDb()
    const rows = db
      .prepare(
        `SELECT te.duration_seconds as duration_seconds, te.started_at as started_at,
                t.id as task_id, t.title as task_title, t.project_id as project_id
         FROM time_entries te
         INNER JOIN tasks t ON t.id = te.task_id
         WHERE te.ended_at IS NOT NULL AND te.started_at >= ? AND te.started_at < ?`
      )
      .all(fromIso, toIso) as EntryRow[]

    let totalSeconds = 0
    const byDayMap = new Map<string, number>()
    const byProjectMap = new Map<string | null, number>()
    const byTaskMap = new Map<string, ReportTaskTotal>()

    for (const row of rows) {
      const duration = row.duration_seconds ?? 0
      totalSeconds += duration

      const day = dayjs(row.started_at).format('YYYY-MM-DD')
      byDayMap.set(day, (byDayMap.get(day) ?? 0) + duration)

      byProjectMap.set(row.project_id, (byProjectMap.get(row.project_id) ?? 0) + duration)

      const existingTask = byTaskMap.get(row.task_id)
      if (existingTask) {
        existingTask.totalSeconds += duration
      } else {
        byTaskMap.set(row.task_id, {
          taskId: row.task_id,
          title: row.task_title,
          projectId: row.project_id,
          totalSeconds: duration
        })
      }
    }

    const byDay: ReportDayTotal[] = Array.from(byDayMap.entries())
      .map(([date, seconds]) => ({ date, totalSeconds: seconds }))
      .sort((a, b) => (a.date < b.date ? -1 : 1))

    const byProject: ReportProjectTotal[] = Array.from(byProjectMap.entries())
      .map(([projectId, seconds]) => ({ projectId, totalSeconds: seconds }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds)

    const byTask: ReportTaskTotal[] = Array.from(byTaskMap.values()).sort(
      (a, b) => b.totalSeconds - a.totalSeconds
    )

    return { totalSeconds, byDay, byProject, byTask }
  }
}
