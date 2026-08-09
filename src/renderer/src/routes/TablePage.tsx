import { useState } from 'react'
import {
  ActionIcon,
  Badge,
  Checkbox,
  Chip,
  Group,
  MultiSelect,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Title
} from '@mantine/core'
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
  IconFlag,
  IconSearch,
  IconTrash,
  IconArchive
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import type { Task, TaskPriority } from '@shared/types'
import { TaskDetailDrawer } from '../components/tasks/TaskDetailDrawer'
import { ColorDot } from '../components/common/ColorDot'
import { useProjectsStore } from '../stores/projectsStore'
import { useTagsStore } from '../stores/tagsStore'
import { useTasksStore } from '../stores/tasksStore'
import { useTimerStore } from '../stores/timerStore'
import { useUiFilterStore } from '../stores/uiFilterStore'
import { formatDuration, minutesToHHMM } from '../utils/formatDuration'
import { PRIORITY_COLORS, PRIORITY_ORDER } from '../utils/priority'

type SortCol = 'title' | 'project' | 'priority' | 'dueDate' | 'timeSpent' | 'estimate' | 'kanban'
type SortDir = 'asc' | 'desc'
type StatusFilter = 'all' | 'active' | 'done'

function SortIcon({ col, sortCol, sortDir }: { col: SortCol; sortCol: SortCol; sortDir: SortDir }) {
  if (col !== sortCol) return <IconArrowsSort size={13} opacity={0.35} />
  return sortDir === 'asc' ? <IconArrowDown size={13} /> : <IconArrowUp size={13} />
}

function HeaderCell({
  col,
  label,
  sortCol,
  sortDir,
  onSort
}: {
  col: SortCol
  label: string
  sortCol: SortCol
  sortDir: SortDir
  onSort: (col: SortCol) => void
}) {
  return (
    <Table.Th
      style={{ cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}
      onClick={() => onSort(col)}
    >
      <Group gap={4} wrap="nowrap">
        <Text size="sm" fw={600}>{label}</Text>
        <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
      </Group>
    </Table.Th>
  )
}

const KANBAN_COLORS = { backlog: 'gray', in_progress: 'blue', done: 'green' }

export default function TablePage() {
  const { t } = useTranslation()
  const tasks = useTasksStore((s) => s.tasks)
  const toggleDone = useTasksStore((s) => s.toggleDone)
  const deleteTask = useTasksStore((s) => s.deleteTask)
  const archiveTask = useTasksStore((s) => s.archiveTask)
  const projects = useProjectsStore((s) => s.projects)
  const tags = useTagsStore((s) => s.tags)
  const activeEntry = useTimerStore((s) => s.activeEntry)
  const elapsedSeconds = useTimerStore((s) => s.elapsedSeconds)
  const selectedProjectId = useUiFilterStore((s) => s.selectedProjectId)

  const projectById = new Map(projects.map((p) => [p.id, p]))
  const tagById = new Map(tags.map((tg) => [tg.id, tg]))

  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [search, setSearch] = useState('')
  const [filterProjectId, setFilterProjectId] = useState<string | null>(selectedProjectId)
  const [filterPriorities, setFilterPriorities] = useState<TaskPriority[]>([])
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [filterTagIds, setFilterTagIds] = useState<string[]>([])
  const [sortCol, setSortCol] = useState<SortCol>('title')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const filtered = tasks
    .filter((task) => {
      if (filterStatus === 'active' && task.isDone) return false
      if (filterStatus === 'done' && !task.isDone) return false
      if (filterProjectId && task.projectId !== filterProjectId) return false
      if (filterPriorities.length && !filterPriorities.includes(task.priority)) return false
      if (filterTagIds.length && !filterTagIds.some((id) => task.tagIds.includes(id))) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          task.title.toLowerCase().includes(q) ||
          (task.description?.toLowerCase().includes(q) ?? false)
        )
      }
      return true
    })
    .sort((a, b) => {
      let cmp = 0
      switch (sortCol) {
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'project': {
          const pa = projectById.get(a.projectId ?? '')?.name ?? ''
          const pb = projectById.get(b.projectId ?? '')?.name ?? ''
          cmp = pa.localeCompare(pb)
          break
        }
        case 'priority':
          cmp = PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
          break
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) cmp = 0
          else if (!a.dueDate) cmp = 1
          else if (!b.dueDate) cmp = -1
          else cmp = a.dueDate.localeCompare(b.dueDate)
          break
        case 'timeSpent':
          cmp = b.timeSpentSeconds - a.timeSpentSeconds
          break
        case 'estimate':
          cmp = (a.timeEstimateMinutes ?? -1) - (b.timeEstimateMinutes ?? -1)
          break
        case 'kanban':
          cmp = a.kanbanStatus.localeCompare(b.kanbanStatus)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

  const priorityOptions = (['high', 'medium', 'low', 'none'] as TaskPriority[]).map((p) => ({
    value: p,
    label: t(`tasks.priority${p.charAt(0).toUpperCase()}${p.slice(1)}`)
  }))

  return (
    <Stack gap="sm">
      <Title order={2}>{t('table.title')}</Title>

      {/* Filter bar */}
      <Group gap="sm" wrap="wrap">
        <TextInput
          placeholder={t('tasks.search')}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          leftSection={<IconSearch size={15} />}
          w={200}
          onKeyDown={(e) => e.key === 'Escape' && setSearch('')}
        />
        <Select
          placeholder={t('tasks.project')}
          value={filterProjectId}
          onChange={setFilterProjectId}
          clearable
          data={projects.map((p) => ({ value: p.id, label: p.name }))}
          w={160}
        />
        <MultiSelect
          placeholder={t('tasks.priority')}
          value={filterPriorities}
          onChange={(v) => setFilterPriorities(v as TaskPriority[])}
          data={priorityOptions}
          w={160}
        />
        <MultiSelect
          placeholder={t('tasks.tags')}
          value={filterTagIds}
          onChange={setFilterTagIds}
          data={tags.map((tg) => ({ value: tg.id, label: tg.name }))}
          w={160}
        />
        <Chip.Group value={filterStatus} onChange={(v) => setFilterStatus(v as StatusFilter)}>
          <Group gap="xs">
            <Chip value="all" size="sm">{t('table.statusAll')}</Chip>
            <Chip value="active" size="sm">{t('table.statusActive')}</Chip>
            <Chip value="done" size="sm">{t('table.statusDone')}</Chip>
          </Group>
        </Chip.Group>
      </Group>

      <Text size="xs" c="dimmed">{filtered.length} {t('table.rows')}</Text>

      <ScrollArea>
        <Table striped highlightOnHover withTableBorder withColumnBorders style={{ minWidth: 860 }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={36} />
              <HeaderCell col="title" label={t('tasks.title')} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <HeaderCell col="project" label={t('tasks.project')} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <HeaderCell col="priority" label={t('tasks.priority')} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <HeaderCell col="kanban" label={t('table.status')} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <Table.Th style={{ whiteSpace: 'nowrap' }}><Text size="sm" fw={600}>{t('tasks.tags')}</Text></Table.Th>
              <HeaderCell col="dueDate" label={t('tasks.dueDate')} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <HeaderCell col="estimate" label={t('tasks.estimate')} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <HeaderCell col="timeSpent" label={t('tasks.timeSpent')} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <Table.Th w={72} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={10}>
                  <Text c="dimmed" ta="center" py="md">{t('tasks.noTasks')}</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              filtered.map((task) => {
                const project = task.projectId ? projectById.get(task.projectId) : undefined
                const taskTags = task.tagIds.map((id) => tagById.get(id)).filter(Boolean)
                const isTracking = activeEntry?.taskId === task.id
                const totalSeconds = task.timeSpentSeconds + (isTracking ? elapsedSeconds : 0)

                return (
                  <Table.Tr
                    key={task.id}
                    style={{ cursor: 'pointer', opacity: task.isDone ? 0.65 : 1 }}
                  >
                    <Table.Td onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={task.isDone}
                        onChange={() => void toggleDone(task.id)}
                        aria-label={t('tasks.markDone')}
                      />
                    </Table.Td>
                    <Table.Td onClick={() => setEditingTask(task)} style={{ minWidth: 180 }}>
                      <Text
                        size="sm"
                        fw={500}
                        td={task.isDone ? 'line-through' : undefined}
                        style={{ borderLeft: task.color ? `3px solid ${task.color}` : undefined, paddingLeft: task.color ? 6 : undefined }}
                      >
                        {task.title}
                      </Text>
                    </Table.Td>
                    <Table.Td onClick={() => setEditingTask(task)}>
                      {project ? (
                        <Badge size="xs" variant="light" leftSection={<ColorDot color={project.color} />}>
                          {project.name}
                        </Badge>
                      ) : (
                        <Text size="xs" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                    <Table.Td onClick={() => setEditingTask(task)}>
                      {task.priority !== 'none' ? (
                        <Badge size="xs" color={PRIORITY_COLORS[task.priority]} variant="light" leftSection={<IconFlag size={10} />}>
                          {t(`tasks.priority${task.priority.charAt(0).toUpperCase()}${task.priority.slice(1)}`)}
                        </Badge>
                      ) : (
                        <Text size="xs" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                    <Table.Td onClick={() => setEditingTask(task)}>
                      <Badge size="xs" color={KANBAN_COLORS[task.kanbanStatus]} variant="light">
                        {t(`kanban.${task.kanbanStatus === 'in_progress' ? 'inProgress' : task.kanbanStatus}`)}
                      </Badge>
                    </Table.Td>
                    <Table.Td onClick={() => setEditingTask(task)} style={{ maxWidth: 160 }}>
                      <Group gap={4} wrap="wrap">
                        {taskTags.length > 0
                          ? taskTags.map((tg) => tg && (
                            <Badge key={tg.id} size="xs" variant="outline" leftSection={<ColorDot color={tg.color} />}>
                              {tg.name}
                            </Badge>
                          ))
                          : <Text size="xs" c="dimmed">—</Text>
                        }
                      </Group>
                    </Table.Td>
                    <Table.Td onClick={() => setEditingTask(task)}>
                      {task.dueDate ? (
                        <Text size="xs" c={dayjs(task.dueDate).isBefore(dayjs(), 'day') && !task.isDone ? 'red' : undefined}>
                          {dayjs(task.dueDate).format('DD.MM.YYYY')}
                        </Text>
                      ) : (
                        <Text size="xs" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                    <Table.Td onClick={() => setEditingTask(task)}>
                      {task.timeEstimateMinutes != null ? (
                        <Text size="xs" ff="monospace">{minutesToHHMM(task.timeEstimateMinutes)}</Text>
                      ) : (
                        <Text size="xs" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                    <Table.Td onClick={() => setEditingTask(task)}>
                      {totalSeconds > 0 ? (
                        <Text size="xs" ff="monospace" c={isTracking ? 'red' : undefined} fw={isTracking ? 700 : undefined}>
                          {formatDuration(totalSeconds)}
                        </Text>
                      ) : (
                        <Text size="xs" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                    <Table.Td onClick={(e) => e.stopPropagation()}>
                      <Group gap={4} wrap="nowrap">
                        <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => void archiveTask(task.id)} title={t('tasks.archive')}>
                          <IconArchive size={14} />
                        </ActionIcon>
                        <ActionIcon size="sm" variant="subtle" color="red" onClick={() => void deleteTask(task.id)} title={t('common.delete')}>
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                )
              })
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      <TaskDetailDrawer task={editingTask} onClose={() => setEditingTask(null)} />
    </Stack>
  )
}
