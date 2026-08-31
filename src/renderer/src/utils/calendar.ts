import dayjs, { type Dayjs } from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import type { RecurrenceRule, Task } from '@shared/types'

dayjs.extend(isoWeek)

// ── Calendar entry (task placed on a specific day) ────────────────────────────

export interface CalendarEntry {
  task: Task
  start: Dayjs       // effective start for this day (may differ from task.scheduledAt for recurring)
  end: Dayjs
  isRecurring: boolean
}

/** Returns true if a given day matches a recurrence rule and is within the task's due date. */
export function matchesRecurrenceDay(
  rule: RecurrenceRule,
  day: Dayjs,
  dueDate: string | null
): boolean {
  if (dueDate && day.isAfter(dayjs(dueDate), 'day')) return false
  switch (rule.type) {
    case 'daily':
      return true
    case 'weekly':
      return (rule.weekdays ?? []).includes(day.day())
    case 'monthly':
      return day.date() === (rule.monthDay ?? 1)
    case 'interval': {
      // Show on every N-th day starting from the anchor date embedded in scheduledAt.
      // We don't have a separate start date, so approximate: always show (conservative).
      return true
    }
    default:
      return false
  }
}

export const CALENDAR_START_HOUR = 6
export const CALENDAR_END_HOUR = 22
export const SLOT_MINUTES = 30
export const ROW_HEIGHT_PX = 48
export const PIXELS_PER_MINUTE = ROW_HEIGHT_PX / 60

export const CALENDAR_HOURS = Array.from(
  { length: CALENDAR_END_HOUR - CALENDAR_START_HOUR },
  (_, i) => CALENDAR_START_HOUR + i
)

export function startOfWeek(date: Dayjs): Dayjs {
  return date.startOf('isoWeek')
}

export function weekDays(weekStart: Dayjs): Dayjs[] {
  return Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'))
}

export function cellId(date: Dayjs, hour: number, minute: number): string {
  return `cell|${date.format('YYYY-MM-DD')}|${hour}|${minute}`
}

export function parseCellId(id: string): Dayjs | null {
  const [prefix, dateStr, hourStr, minuteStr] = id.split('|')
  if (prefix !== 'cell') return null
  return dayjs(dateStr).hour(Number(hourStr)).minute(Number(minuteStr)).second(0).millisecond(0)
}

export function taskDraggableId(taskId: string): string {
  return `task|${taskId}`
}

export function parseTaskDraggableId(id: string): string | null {
  const [prefix, taskId] = id.split('|')
  return prefix === 'task' ? taskId : null
}

export function minutesFromGridStart(time: Dayjs): number {
  return (time.hour() - CALENDAR_START_HOUR) * 60 + time.minute()
}

export function snapMinutes(minutes: number): number {
  return Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES
}
