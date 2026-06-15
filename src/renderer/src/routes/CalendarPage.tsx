import { useMemo, useState } from 'react'
import { DndContext, type DragEndEvent, closestCenter } from '@dnd-kit/core'
import { ActionIcon, Button, Group, Stack, Title } from '@mantine/core'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import type { Task } from '@shared/types'
import { TaskDetailDrawer } from '../components/tasks/TaskDetailDrawer'
import { UnscheduledList } from '../components/calendar/UnscheduledList'
import { WeekGrid } from '../components/calendar/WeekGrid'
import { useProjectsStore } from '../stores/projectsStore'
import { useTasksStore } from '../stores/tasksStore'
import {
  PIXELS_PER_MINUTE,
  SLOT_MINUTES,
  parseCellId,
  parseTaskDraggableId,
  startOfWeek,
  weekDays
} from '../utils/calendar'

export default function CalendarPage() {
  const { t } = useTranslation()
  const tasks = useTasksStore((s) => s.tasks)
  const updateTask = useTasksStore((s) => s.updateTask)
  const projects = useProjectsStore((s) => s.projects)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(dayjs()))
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])

  const activeTasks = tasks.filter((task) => !task.isDone)
  const unscheduledTasks = activeTasks.filter((task) => !task.scheduledAt)

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of activeTasks) {
      if (!task.scheduledAt) continue
      const dateKey = dayjs(task.scheduledAt).format('YYYY-MM-DD')
      const list = map.get(dateKey) ?? []
      list.push(task)
      map.set(dateKey, list)
    }
    return map
  }, [activeTasks])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const taskId = parseTaskDraggableId(String(active.id))
    const cellTime = parseCellId(String(over.id))
    if (!taskId || !cellTime) return

    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const durationMinutes =
      task.scheduledAt && task.scheduledEnd
        ? Math.max(30, dayjs(task.scheduledEnd).diff(task.scheduledAt, 'minute'))
        : task.timeEstimateMinutes ?? 60

    let newStart = cellTime
    const activeRect = active.rect.current.translated
    if (activeRect) {
      const offsetMinutes = (activeRect.top - over.rect.top) / PIXELS_PER_MINUTE
      const snappedOffset = Math.round(offsetMinutes / SLOT_MINUTES) * SLOT_MINUTES
      newStart = cellTime.add(snappedOffset, 'minute')
    }

    void updateTask(taskId, {
      scheduledAt: newStart.toISOString(),
      scheduledEnd: newStart.add(durationMinutes, 'minute').toISOString()
    })
  }

  const handleUnschedule = (task: Task) => {
    void updateTask(task.id, { scheduledAt: null, scheduledEnd: null })
  }

  const handleResize = (task: Task, newDurationMinutes: number) => {
    if (!task.scheduledAt) return
    void updateTask(task.id, {
      scheduledEnd: dayjs(task.scheduledAt).add(newDurationMinutes, 'minute').toISOString(),
      timeEstimateMinutes: newDurationMinutes
    })
  }

  const days = weekDays(weekStart)
  const weekLabel = `${days[0].format('D.M.')} – ${days[6].format('D.M.YYYY')}`

  return (
    <Stack gap="sm" h="100%">
      <Group justify="space-between">
        <Title order={2}>{t('calendar.title')}</Title>
        <Group gap="xs">
          <ActionIcon variant="default" onClick={() => setWeekStart(weekStart.subtract(1, 'week'))}>
            <IconChevronLeft size={16} />
          </ActionIcon>
          <Button variant="default" onClick={() => setWeekStart(startOfWeek(dayjs()))}>
            {t('calendar.today')}
          </Button>
          <ActionIcon variant="default" onClick={() => setWeekStart(weekStart.add(1, 'week'))}>
            <IconChevronRight size={16} />
          </ActionIcon>
          <Title order={4}>{weekLabel}</Title>
        </Group>
      </Group>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Group align="flex-start" wrap="nowrap" gap="md" style={{ flex: 1, overflow: 'hidden' }}>
          <UnscheduledList
            tasks={unscheduledTasks}
            projectById={projectById}
            onOpen={setEditingTask}
          />
          <WeekGrid
            weekStart={weekStart}
            tasksByDate={tasksByDate}
            projectById={projectById}
            onOpen={setEditingTask}
            onUnschedule={handleUnschedule}
            onResize={handleResize}
          />
        </Group>
      </DndContext>
      <TaskDetailDrawer task={editingTask} onClose={() => setEditingTask(null)} />
    </Stack>
  )
}
