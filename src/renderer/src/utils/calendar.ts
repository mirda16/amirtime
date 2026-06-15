import dayjs, { type Dayjs } from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)

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
