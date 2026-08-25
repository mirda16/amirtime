import dayjs from 'dayjs'
import { getDb } from '../index'
import type {
  ReportDayTotal,
  ReportHourTotal,
  ReportProjectTotal,
  ReportSummary,
  ReportTaskTotal,
  ReportWeekdayDone,
  ReportWeekdayTotal
} from '@shared/types'

interface EntryRow {
  duration_seconds: number
  started_at: string
  task_id: string
  task_title: string
  project_id: string | null
}

interface DoneRow {
  done_at: string
}

export const reportsRepo = {
  getSummary(fromIso: string, toIso: string): ReportSummary {
    const db = getDb()

    // ── Time entries ─────────────────────────────────────────────────────────
    const rows = db
      .prepare(
        `SELECT te.duration_seconds, te.started_at,
                t.id as task_id, t.title as task_title, t.project_id
         FROM time_entries te
         INNER JOIN tasks t ON t.id = te.task_id
         WHERE te.ended_at IS NOT NULL AND te.started_at >= ? AND te.started_at < ?`
      )
      .all(fromIso, toIso) as EntryRow[]

    let totalSeconds = 0
    const byDayMap = new Map<string, number>()
    const byHourMap = new Map<number, number>()
    const byWeekdayMap = new Map<number, number>()
    const byProjectMap = new Map<string | null, number>()
    const byTaskMap = new Map<string, ReportTaskTotal>()

    for (const row of rows) {
      const duration = row.duration_seconds ?? 0
      totalSeconds += duration

      const d = dayjs(row.started_at)

      const day = d.format('YYYY-MM-DD')
      byDayMap.set(day, (byDayMap.get(day) ?? 0) + duration)

      const hour = d.hour()
      byHourMap.set(hour, (byHourMap.get(hour) ?? 0) + duration)

      const weekday = d.day() // 0=Sun…6=Sat
      byWeekdayMap.set(weekday, (byWeekdayMap.get(weekday) ?? 0) + duration)

      byProjectMap.set(row.project_id, (byProjectMap.get(row.project_id) ?? 0) + duration)

      const existing = byTaskMap.get(row.task_id)
      if (existing) {
        existing.totalSeconds += duration
      } else {
        byTaskMap.set(row.task_id, {
          taskId: row.task_id,
          title: row.task_title,
          projectId: row.project_id,
          totalSeconds: duration
        })
      }
    }

    // ── Tasks completed in range ─────────────────────────────────────────────
    const doneRows = db
      .prepare(
        `SELECT done_at FROM tasks
         WHERE done_at IS NOT NULL AND done_at >= ? AND done_at < ?`
      )
      .all(fromIso, toIso) as DoneRow[]

    const doneByWeekdayMap = new Map<number, number>()
    for (const row of doneRows) {
      const weekday = dayjs(row.done_at).day()
      doneByWeekdayMap.set(weekday, (doneByWeekdayMap.get(weekday) ?? 0) + 1)
    }

    // ── Build result arrays ──────────────────────────────────────────────────
    const byDay: ReportDayTotal[] = Array.from(byDayMap.entries())
      .map(([date, seconds]) => ({ date, totalSeconds: seconds }))
      .sort((a, b) => (a.date < b.date ? -1 : 1))

    // All 24 hours, fill missing with 0
    const byHour: ReportHourTotal[] = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      totalSeconds: byHourMap.get(h) ?? 0
    }))

    // All 7 weekdays (0=Sun…6=Sat), fill missing with 0
    const byWeekday: ReportWeekdayTotal[] = Array.from({ length: 7 }, (_, d) => ({
      weekday: d,
      totalSeconds: byWeekdayMap.get(d) ?? 0
    }))

    const tasksDoneByWeekday: ReportWeekdayDone[] = Array.from({ length: 7 }, (_, d) => ({
      weekday: d,
      count: doneByWeekdayMap.get(d) ?? 0
    }))

    const byProject: ReportProjectTotal[] = Array.from(byProjectMap.entries())
      .map(([projectId, seconds]) => ({ projectId, totalSeconds: seconds }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds)

    const byTask: ReportTaskTotal[] = Array.from(byTaskMap.values()).sort(
      (a, b) => b.totalSeconds - a.totalSeconds
    )

    return { totalSeconds, byDay, byHour, byWeekday, tasksDoneByWeekday, byProject, byTask }
  }
}
