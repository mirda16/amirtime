import { DndContext, type DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Divider, Stack, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import type { Project, Tag, Task } from '@shared/types'
import { useTimerStore } from '../../stores/timerStore'
import { TaskListItem } from './TaskListItem'

interface TaskListProps {
  tasks: Task[]
  projects: Project[]
  tags: Tag[]
  onToggleDone: (id: string) => void
  onOpen: (task: Task) => void
  onDelete: (id: string) => void
  onReorder: (orderedIds: string[]) => void
}

function SortableTaskListItem(props: Omit<Parameters<typeof TaskListItem>[0], 'dragHandleProps'>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.task.id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div ref={setNodeRef} style={style}>
      <TaskListItem {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

export function TaskList({
  tasks,
  projects,
  tags,
  onToggleDone,
  onOpen,
  onDelete,
  onReorder
}: TaskListProps) {
  const { t } = useTranslation()
  const activeEntry = useTimerStore((s) => s.activeEntry)
  const elapsedSeconds = useTimerStore((s) => s.elapsedSeconds)
  const startTimer = useTimerStore((s) => s.start)
  const stopTimer = useTimerStore((s) => s.stop)
  const projectById = new Map(projects.map((p) => [p.id, p]))
  const tagById = new Map(tags.map((tg) => [tg.id, tg]))
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  if (tasks.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        {t('tasks.noTasks')}
      </Text>
    )
  }

  const activeTasks = tasks.filter((task) => !task.isDone)
  const doneTasks = tasks.filter((task) => task.isDone)

  const handleToggleTimer = (taskId: string) => {
    if (activeEntry?.taskId === taskId) {
      void stopTimer()
    } else {
      void startTimer(taskId)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = activeTasks.map((task) => task.id)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = [...ids]
    reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, ids[oldIndex])
    onReorder(reordered)
  }

  const itemProps = (task: Task) => ({
    task,
    project: task.projectId ? projectById.get(task.projectId) : undefined,
    tags: task.tagIds.map((id) => tagById.get(id)).filter((tag): tag is Tag => !!tag),
    isTracking: activeEntry?.taskId === task.id,
    elapsedSeconds,
    onToggleDone: () => onToggleDone(task.id),
    onOpen: () => onOpen(task),
    onDelete: () => onDelete(task.id),
    onToggleTimer: () => handleToggleTimer(task.id)
  })

  return (
    <Stack gap={0}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={activeTasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {activeTasks.map((task) => (
            <SortableTaskListItem key={task.id} {...itemProps(task)} />
          ))}
        </SortableContext>
      </DndContext>
      {doneTasks.length > 0 && (
        <>
          <Divider label={t('tasks.markDone')} labelPosition="center" mt="md" mb="xs" />
          {doneTasks.map((task) => (
            <TaskListItem key={task.id} {...itemProps(task)} />
          ))}
        </>
      )}
    </Stack>
  )
}
