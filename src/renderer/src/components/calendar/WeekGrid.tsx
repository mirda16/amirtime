import type { Dayjs } from 'dayjs'
import { Text } from '@mantine/core'
import type { Project, Task } from '@shared/types'
import { CALENDAR_HOURS, ROW_HEIGHT_PX, weekDays } from '../../utils/calendar'
import { DayColumn } from './DayColumn'

const HEADER_HEIGHT = 40

interface WeekGridProps {
  weekStart: Dayjs
  tasksByDate: Map<string, Task[]>
  projectById: Map<string, Project>
  onOpen: (task: Task) => void
  onUnschedule: (task: Task) => void
  onResize: (task: Task, newDurationMinutes: number) => void
}

export function WeekGrid({ weekStart, tasksByDate, projectById, onOpen, onUnschedule, onResize }: WeekGridProps) {
  const days = weekDays(weekStart)

  return (
    <div style={{ display: 'flex', flex: 1, overflowY: 'auto' }}>
      <div style={{ width: 48, flexShrink: 0 }}>
        <div style={{ height: HEADER_HEIGHT }} />
        {CALENDAR_HOURS.map((hour) => (
          <div
            key={hour}
            style={{ height: ROW_HEIGHT_PX, textAlign: 'right', paddingRight: 6 }}
          >
            <Text size="xs" c="dimmed">
              {String(hour).padStart(2, '0')}:00
            </Text>
          </div>
        ))}
      </div>
      {days.map((date) => (
        <DayColumn
          key={date.format('YYYY-MM-DD')}
          date={date}
          tasks={tasksByDate.get(date.format('YYYY-MM-DD')) ?? []}
          projectById={projectById}
          onOpen={onOpen}
          onUnschedule={onUnschedule}
          onResize={onResize}
        />
      ))}
    </div>
  )
}
