import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { Box, Text } from '@mantine/core'
import type { Project, Task } from '@shared/types'
import {
  CALENDAR_HOURS,
  ROW_HEIGHT_PX,
  SLOT_MINUTES,
  cellId,
  minutesFromGridStart,
  PIXELS_PER_MINUTE
} from '../../utils/calendar'
import { CalendarTaskBlock } from './CalendarTaskBlock'
import { DroppableCell } from './DroppableCell'

interface DayColumnProps {
  date: Dayjs
  tasks: Task[]
  projectById: Map<string, Project>
  onOpen: (task: Task) => void
  onUnschedule: (task: Task) => void
  onResize: (task: Task, newDurationMinutes: number) => void
}

const SLOTS_PER_HOUR = 60 / SLOT_MINUTES
const SLOT_HEIGHT_PX = ROW_HEIGHT_PX / SLOTS_PER_HOUR

export function DayColumn({ date, tasks, projectById, onOpen, onUnschedule, onResize }: DayColumnProps) {
  const isToday = date.isSame(dayjs(), 'day')
  const totalHeight = CALENDAR_HOURS.length * ROW_HEIGHT_PX

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <Box
        ta="center"
        py="xs"
        style={{
          borderBottom: '1px solid var(--mantine-color-default-border)',
          background: isToday ? 'var(--mantine-color-blue-light)' : undefined
        }}
      >
        <Text size="sm" fw={isToday ? 700 : 500}>
          {date.format('ddd D.M.')}
        </Text>
      </Box>
      <div style={{ position: 'relative', height: totalHeight }}>
        {CALENDAR_HOURS.map((hour) => (
          <div key={hour} style={{ display: 'flex', flexDirection: 'column' }}>
            {Array.from({ length: SLOTS_PER_HOUR }, (_, slotIndex) => (
              <DroppableCell
                key={slotIndex}
                id={cellId(date, hour, slotIndex * SLOT_MINUTES)}
                height={SLOT_HEIGHT_PX}
              />
            ))}
          </div>
        ))}
        {tasks.map((task) => {
          const start = dayjs(task.scheduledAt)
          const end = dayjs(task.scheduledEnd ?? task.scheduledAt)
          const durationMinutes = Math.max(SLOT_MINUTES, end.diff(start, 'minute'))
          const top = minutesFromGridStart(start) * PIXELS_PER_MINUTE
          const height = durationMinutes * PIXELS_PER_MINUTE
          return (
            <CalendarTaskBlock
              key={task.id}
              task={task}
              project={task.projectId ? projectById.get(task.projectId) : undefined}
              top={top}
              height={height}
              durationMinutes={durationMinutes}
              onOpen={() => onOpen(task)}
              onUnschedule={() => onUnschedule(task)}
              onResize={(newDuration) => onResize(task, newDuration)}
            />
          )
        })}
      </div>
    </div>
  )
}
