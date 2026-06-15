import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { ActionIcon, Text } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import type { Project, Task } from '@shared/types'
import { PIXELS_PER_MINUTE, SLOT_MINUTES, taskDraggableId } from '../../utils/calendar'

interface CalendarTaskBlockProps {
  task: Task
  project: Project | undefined
  top: number
  height: number
  durationMinutes: number
  onOpen: () => void
  onUnschedule: () => void
  onResize: (newDurationMinutes: number) => void
}

export function CalendarTaskBlock({
  task,
  project,
  top,
  height,
  durationMinutes,
  onOpen,
  onUnschedule,
  onResize
}: CalendarTaskBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: taskDraggableId(task.id)
  })
  const [resizeDelta, setResizeDelta] = useState(0)

  const handleResizeStart = (e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const startY = e.clientY
    const minHeight = SLOT_MINUTES * PIXELS_PER_MINUTE

    const handleMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientY - startY
      setResizeDelta(Math.max(delta, minHeight - height))
    }

    const handleUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      const delta = upEvent.clientY - startY
      const deltaMinutes = Math.round(delta / PIXELS_PER_MINUTE / SLOT_MINUTES) * SLOT_MINUTES
      const newDuration = Math.max(SLOT_MINUTES, durationMinutes + deltaMinutes)
      setResizeDelta(0)
      if (newDuration !== durationMinutes) onResize(newDuration)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      style={{
        position: 'absolute',
        top,
        left: 2,
        right: 2,
        height: height + resizeDelta,
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 100 : 1,
        background: project?.color ?? 'var(--mantine-color-blue-light)',
        borderRadius: 4,
        padding: '2px 6px',
        cursor: 'grab',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
        <Text size="xs" fw={500} truncate c={project?.color ? 'white' : undefined}>
          {task.title}
        </Text>
        <ActionIcon
          size="xs"
          variant="transparent"
          c={project?.color ? 'white' : undefined}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onUnschedule()
          }}
        >
          <IconX size={12} />
        </ActionIcon>
      </div>
      <div
        onPointerDown={handleResizeStart}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 6,
          cursor: 'ns-resize'
        }}
      />
    </div>
  )
}
