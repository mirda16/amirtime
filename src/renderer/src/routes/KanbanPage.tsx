import { useMemo, useState } from 'react'
import { Badge, Button, Group, Paper, ScrollArea, Stack, Text, Title } from '@mantine/core'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconPlus } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import type { KanbanStatus, Task } from '@shared/types'
import { TaskFormModal } from '../components/tasks/TaskFormModal'
import { useProjectsStore } from '../stores/projectsStore'
import { useTasksStore } from '../stores/tasksStore'
import { PRIORITY_COLORS } from '../utils/priority'

const COLUMNS: { id: KanbanStatus; labelKey: string; color: string }[] = [
  { id: 'backlog', labelKey: 'kanban.backlog', color: 'gray' },
  { id: 'in_progress', labelKey: 'kanban.inProgress', color: 'blue' },
  { id: 'done', labelKey: 'kanban.done', color: 'green' }
]

interface CardContentProps {
  task: Task
  projectName?: string
}

function CardContent({ task, projectName }: CardContentProps) {
  const today = dayjs().format('YYYY-MM-DD')
  const isOverdue = task.dueDate && !task.isDone && task.dueDate < today

  return (
    <Stack gap={6}>
      <Text
        size="sm"
        fw={500}
        style={{ wordBreak: 'break-word', textDecoration: task.isDone ? 'line-through' : 'none' }}
        c={task.isDone ? 'dimmed' : undefined}
      >
        {task.title}
      </Text>
      <Group gap={6} wrap="wrap">
        {task.priority !== 'none' && (
          <Badge size="xs" color={PRIORITY_COLORS[task.priority]} variant="light">
            {task.priority}
          </Badge>
        )}
        {task.dueDate && (
          <Text size="xs" c={isOverdue ? 'red' : 'dimmed'}>
            {dayjs(task.dueDate).format('D.M.')}
          </Text>
        )}
        {projectName && (
          <Text size="xs" c="dimmed" style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {projectName}
          </Text>
        )}
      </Group>
      {task.subtasks.length > 0 && (
        <Text size="xs" c="dimmed">
          {task.subtasks.filter((s) => s.isDone).length}/{task.subtasks.length} subtasks
        </Text>
      )}
    </Stack>
  )
}

function KanbanCard({ task, projectName }: { task: Task; projectName?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id
  })

  return (
    <Paper
      ref={setNodeRef}
      withBorder
      shadow="xs"
      p="sm"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        cursor: 'grab',
        borderLeft: task.color ? `3px solid ${task.color}` : undefined
      }}
      {...attributes}
      {...listeners}
    >
      <CardContent task={task} projectName={projectName} />
    </Paper>
  )
}

function KanbanColumn({
  column,
  tasks,
  projectMap,
  onAddTask
}: {
  column: (typeof COLUMNS)[number]
  tasks: Task[]
  projectMap: Map<string, string>
  onAddTask: () => void
}) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks])

  return (
    <Stack style={{ flex: '0 0 290px' }} gap="xs">
      <Group justify="space-between">
        <Group gap="xs">
          <Text fw={600} size="sm">
            {t(column.labelKey)}
          </Text>
          <Badge color={column.color} size="sm" variant="light">
            {tasks.length}
          </Badge>
        </Group>
        <Button
          size="compact-xs"
          variant="subtle"
          leftSection={<IconPlus size={12} />}
          onClick={onAddTask}
        >
          {t('common.add')}
        </Button>
      </Group>
      <ScrollArea.Autosize mah="calc(100vh - 200px)">
        <Stack
          ref={setNodeRef}
          gap="xs"
          p="xs"
          style={{
            minHeight: 120,
            borderRadius: 8,
            background: isOver
              ? 'light-dark(var(--mantine-color-blue-0), var(--mantine-color-blue-9))'
              : 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
            transition: 'background 0.15s'
          }}
        >
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                projectName={task.projectId ? projectMap.get(task.projectId) : undefined}
              />
            ))}
          </SortableContext>
        </Stack>
      </ScrollArea.Autosize>
    </Stack>
  )
}

export default function KanbanPage() {
  const { t } = useTranslation()
  const tasks = useTasksStore((s) => s.tasks)
  const updateTask = useTasksStore((s) => s.updateTask)
  const projects = useProjectsStore((s) => s.projects)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [modalOpened, setModalOpened] = useState(false)
  const [defaultKanbanStatus, setDefaultKanbanStatus] = useState<KanbanStatus>('backlog')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects])

  const tasksByColumn = useMemo(() => {
    const grouped: Record<KanbanStatus, Task[]> = { backlog: [], in_progress: [], done: [] }
    for (const task of tasks) {
      grouped[task.kanbanStatus].push(task)
    }
    return grouped
  }, [tasks])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask(tasks.find((t) => t.id === event.active.id) ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const task = tasks.find((t) => t.id === active.id)
    if (!task) return

    const overId = over.id as string
    const destColumn = (
      COLUMNS.some((c) => c.id === overId)
        ? overId
        : (tasks.find((t) => t.id === overId)?.kanbanStatus ?? task.kanbanStatus)
    ) as KanbanStatus

    if (destColumn === task.kanbanStatus) return

    void updateTask(task.id, {
      kanbanStatus: destColumn,
      ...(destColumn === 'done' ? { isDone: true } : task.isDone ? { isDone: false } : {})
    })
  }

  const openAddForColumn = (status: KanbanStatus) => {
    setDefaultKanbanStatus(status)
    setModalOpened(true)
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>{t('kanban.title')}</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => openAddForColumn('backlog')}>
          {t('tasks.newTask')}
        </Button>
      </Group>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Group align="flex-start" wrap="nowrap" style={{ overflowX: 'auto', paddingBottom: 8 }} gap="md">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByColumn[column.id]}
              projectMap={projectMap}
              onAddTask={() => openAddForColumn(column.id)}
            />
          ))}
        </Group>
        <DragOverlay>
          {activeTask && (
            <Paper withBorder shadow="md" p="sm" style={{ width: 290, cursor: 'grabbing' }}>
              <CardContent
                task={activeTask}
                projectName={
                  activeTask.projectId ? projectMap.get(activeTask.projectId) : undefined
                }
              />
            </Paper>
          )}
        </DragOverlay>
      </DndContext>
      <TaskFormModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        task={null}
        defaultKanbanStatus={defaultKanbanStatus}
      />
    </Stack>
  )
}
