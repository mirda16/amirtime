import { useEffect, useState } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { Box, Text } from '@mantine/core'
import type { Project, Task } from '@shared/types'
import type { CalendarEntry } from '../../utils/calendar'
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
  entries: CalendarEntry[]
  projectById: Map<string, Project>
  onOpen: (task: Task) => void
  onUnschedule: (task: Task) => void
  onResize: (task: Task, newDurationMinutes: number) => void
}

const SLOTS_PER_HOUR = 60 / SLOT_MINUTES
const SLOT_HEIGHT_PX = ROW_HEIGHT_PX / SLOTS_PER_HOUR

function useNowTop(): number | null {
  const [top, setTop] = useState<number | null>(null)

  useEffect(() => {
    const calc = () => {
      const now = dayjs()
      const minutes = minutesFromGridStart(now)
      if (minutes < 0 || minutes > CALENDAR_HOURS.length * 60) {
        setTop(null)
      } else {
        setTop(Math.round(minutes * PIXELS_PER_MINUTE))
      }
    }

    calc()
    const id = setInterval(calc, 60_000)
    return () => clearInterval(id)
  }, [])

  return top
}

export function DayColumn({ date, entries, projectById, onOpen, onUnschedule, onResize }: DayColumnProps) {
  const isToday = date.isSame(dayjs(), 'day')
  const totalHeight = CALENDAR_HOURS.length * ROW_HEIGHT_PX
  const nowTop = useNowTop()

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
        {isToday && nowTop !== null && (
          <div
            style={{
              position: 'absolute',
              top: nowTop,
              left: 0,
              right: 0,
              height: 2,
              background: 'var(--mantine-color-red-6)',
              zIndex: 10,
              pointerEvents: 'none'
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: -4,
                top: -4,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'var(--mantine-color-red-6)'
              }}
            />
          </div>
        )}
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
        {entries.map((entry) => {
          const { task, start, end, isRecurring } = entry
          const durationMinutes = Math.max(SLOT_MINUTES, end.diff(start, 'minute'))
          const top = minutesFromGridStart(start) * PIXELS_PER_MINUTE
          const height = durationMinutes * PIXELS_PER_MINUTE
          return (
            <CalendarTaskBlock
              key={`${task.id}-${start.toISOString()}`}
              task={task}
              project={task.projectId ? projectById.get(task.projectId) : undefined}
              top={top}
              height={height}
              durationMinutes={durationMinutes}
              isRecurring={isRecurring}
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
