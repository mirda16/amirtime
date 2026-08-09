import { useEffect, useRef, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Checkbox,
  Chip,
  Group,
  MultiSelect,
  Popover,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import {
  IconArchive,
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
  IconFlag,
  IconPlus,
  IconSearch,
  IconTrash
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import type { CreateTaskInput, Task, TaskPriority, UpdateTaskInput } from '@shared/types'
import { ColorDot } from '../components/common/ColorDot'
import { useProjectsStore } from '../stores/projectsStore'
import { useTagsStore } from '../stores/tagsStore'
import { useTasksStore } from '../stores/tasksStore'
import { useTimerStore } from '../stores/timerStore'
import { useUiFilterStore } from '../stores/uiFilterStore'
import { formatDuration, hhmmToMinutes, minutesToHHMM } from '../utils/formatDuration'
import { PRIORITY_COLORS, PRIORITY_ORDER } from '../utils/priority'

// ── Types ─────────────────────────────────────────────────────────────────────

type EditCol = 'title' | 'projectId' | 'priority' | 'kanbanStatus' | 'dueDate' | 'estimate' | 'tags'
type EditingCell = { taskId: string; col: EditCol } | null
type SortCol = 'title' | 'project' | 'priority' | 'dueDate' | 'timeSpent' | 'estimate' | 'kanban'
type SortDir = 'asc' | 'desc'
type StatusFilter = 'all' | 'active' | 'done'

const KANBAN_COLORS = { backlog: 'gray', in_progress: 'blue', done: 'green' }

// ── Sort header ───────────────────────────────────────────────────────────────

function HeaderCell({
  col, label, sortCol, sortDir, onSort
}: {
  col: SortCol; label: string; sortCol: SortCol; sortDir: SortDir
  onSort: (col: SortCol) => void
}) {
  const active = col === sortCol
  return (
    <Table.Th style={{ cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }} onClick={() => onSort(col)}>
      <Group gap={4} wrap="nowrap">
        <Text size="sm" fw={600}>{label}</Text>
        {active
          ? (sortDir === 'asc' ? <IconArrowDown size={13} /> : <IconArrowUp size={13} />)
          : <IconArrowsSort size={13} opacity={0.3} />}
      </Group>
    </Table.Th>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TablePage() {
  const { t } = useTranslation()
  const tasks        = useTasksStore((s) => s.tasks)
  const toggleDone   = useTasksStore((s) => s.toggleDone)
  const updateTask   = useTasksStore((s) => s.updateTask)
  const createTask   = useTasksStore((s) => s.createTask)
  const deleteTask   = useTasksStore((s) => s.deleteTask)
  const archiveTask  = useTasksStore((s) => s.archiveTask)
  const projects     = useProjectsStore((s) => s.projects)
  const tags         = useTagsStore((s) => s.tags)
  const activeEntry  = useTimerStore((s) => s.activeEntry)
  const elapsedSecs  = useTimerStore((s) => s.elapsedSeconds)
  const selectedProjId = useUiFilterStore((s) => s.selectedProjectId)

  const projectById = new Map(projects.map((p) => [p.id, p]))
  const tagById     = new Map(tags.map((tg) => [tg.id, tg]))

  // ── Editing state ────────────────────────────────────────────────────────
  const [editingCell, setEditingCell] = useState<EditingCell>(null)
  const [draft, setDraft] = useState('')          // for text inputs
  const [draftDate, setDraftDate] = useState<Date | null>(null)

  // ── Filter / sort state ──────────────────────────────────────────────────
  const [search, setSearch]           = useState('')
  const [filterProject, setFilterProject] = useState<string | null>(selectedProjId)
  const [filterPriorities, setFilterPriorities] = useState<TaskPriority[]>([])
  const [filterTagIds, setFilterTagIds]   = useState<string[]>([])
  const [filterStatus, setFilterStatus]   = useState<StatusFilter>('all')
  const [sortCol, setSortCol]   = useState<SortCol>('title')
  const [sortDir, setSortDir]   = useState<SortDir>('asc')

  // ── New task row ─────────────────────────────────────────────────────────
  const [newTitle, setNewTitle] = useState('')
  const newTitleRef = useRef<HTMLInputElement>(null)

  // ── Helpers ──────────────────────────────────────────────────────────────

  const startEdit = (taskId: string, col: EditCol, currentText = '') => {
    setEditingCell({ taskId, col })
    setDraft(currentText)
  }

  const cancelEdit = () => setEditingCell(null)

  const save = async (taskId: string, patch: UpdateTaskInput) => {
    setEditingCell(null)
    await updateTask(taskId, patch)
  }

  const saveText = (taskId: string, col: 'title', value: string) => {
    const trimmed = value.trim()
    if (!trimmed) { cancelEdit(); return }
    void save(taskId, { [col]: trimmed })
  }

  const saveEstimate = (taskId: string, value: string) => {
    const minutes = hhmmToMinutes(value.trim())
    void save(taskId, { timeEstimateMinutes: minutes ?? null })
  }

  const handleCreateTask = async () => {
    const trimmed = newTitle.trim()
    if (!trimmed) return
    const input: CreateTaskInput = { title: trimmed }
    if (filterProject) input.projectId = filterProject
    await createTask(input)
    setNewTitle('')
    setTimeout(() => newTitleRef.current?.focus(), 50)
  }

  // ── Sort toggle ──────────────────────────────────────────────────────────

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('asc') }
  }

  // ── Filtering & sorting ──────────────────────────────────────────────────

  const filtered = tasks
    .filter((task) => {
      if (filterStatus === 'active' && task.isDone) return false
      if (filterStatus === 'done'   && !task.isDone) return false
      if (filterProject && task.projectId !== filterProject) return false
      if (filterPriorities.length && !filterPriorities.includes(task.priority)) return false
      if (filterTagIds.length && !filterTagIds.some((id) => task.tagIds.includes(id))) return false
      if (search) {
        const q = search.toLowerCase()
        return task.title.toLowerCase().includes(q) || (task.description?.toLowerCase().includes(q) ?? false)
      }
      return true
    })
    .sort((a, b) => {
      let cmp = 0
      switch (sortCol) {
        case 'title':    cmp = a.title.localeCompare(b.title); break
        case 'project': {
          const pa = projectById.get(a.projectId ?? '')?.name ?? ''
          const pb = projectById.get(b.projectId ?? '')?.name ?? ''
          cmp = pa.localeCompare(pb); break
        }
        case 'priority': cmp = PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority); break
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) cmp = 0
          else if (!a.dueDate) cmp = 1
          else if (!b.dueDate) cmp = -1
          else cmp = a.dueDate.localeCompare(b.dueDate)
          break
        case 'timeSpent': cmp = b.timeSpentSeconds - a.timeSpentSeconds; break
        case 'estimate':  cmp = (a.timeEstimateMinutes ?? -1) - (b.timeEstimateMinutes ?? -1); break
        case 'kanban':    cmp = a.kanbanStatus.localeCompare(b.kanbanStatus); break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

  // ── Cell renderers ───────────────────────────────────────────────────────

  const isEditing = (taskId: string, col: EditCol) =>
    editingCell?.taskId === taskId && editingCell.col === col

  const cellStyle: React.CSSProperties = { padding: '4px 8px', verticalAlign: 'middle' }
  const clickable: React.CSSProperties = { cursor: 'text' }

  function TitleCell({ task }: { task: Task }) {
    const editing = isEditing(task.id, 'title')
    return (
      <Table.Td style={{ ...cellStyle, minWidth: 200 }}>
        {editing ? (
          <TextInput
            autoFocus
            size="xs"
            variant="filled"
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            onBlur={() => saveText(task.id, 'title', draft)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveText(task.id, 'title', draft)
              if (e.key === 'Escape') cancelEdit()
            }}
          />
        ) : (
          <Text
            size="sm" fw={500}
            td={task.isDone ? 'line-through' : undefined}
            c={task.isDone ? 'dimmed' : undefined}
            style={{
              ...clickable,
              borderLeft: task.color ? `3px solid ${task.color}` : undefined,
              paddingLeft: task.color ? 6 : undefined
            }}
            onClick={() => startEdit(task.id, 'title', task.title)}
          >
            {task.title}
          </Text>
        )}
      </Table.Td>
    )
  }

  function ProjectCell({ task }: { task: Task }) {
    const editing = isEditing(task.id, 'projectId')
    const project = task.projectId ? projectById.get(task.projectId) : undefined
    return (
      <Table.Td style={{ ...cellStyle, minWidth: 130 }}>
        {editing ? (
          <Select
            autoFocus
            size="xs"
            value={task.projectId}
            clearable
            data={projects.map((p) => ({ value: p.id, label: p.name }))}
            onChange={(v) => void save(task.id, { projectId: v ?? null })}
            onBlur={cancelEdit}
          />
        ) : (
          <div style={clickable} onClick={() => setEditingCell({ taskId: task.id, col: 'projectId' })}>
            {project
              ? <Badge size="xs" variant="light" leftSection={<ColorDot color={project.color} />}>{project.name}</Badge>
              : <Text size="xs" c="dimmed">—</Text>}
          </div>
        )}
      </Table.Td>
    )
  }

  function PriorityCell({ task }: { task: Task }) {
    const editing = isEditing(task.id, 'priority')
    const priorityOptions = (['high', 'medium', 'low', 'none'] as TaskPriority[]).map((p) => ({
      value: p,
      label: t(`tasks.priority${p.charAt(0).toUpperCase()}${p.slice(1)}`)
    }))
    return (
      <Table.Td style={{ ...cellStyle, minWidth: 110 }}>
        {editing ? (
          <Select
            autoFocus
            size="xs"
            value={task.priority}
            data={priorityOptions}
            allowDeselect={false}
            onChange={(v) => void save(task.id, { priority: (v ?? 'none') as TaskPriority })}
            onBlur={cancelEdit}
          />
        ) : (
          <div style={clickable} onClick={() => setEditingCell({ taskId: task.id, col: 'priority' })}>
            {task.priority !== 'none'
              ? <Badge size="xs" color={PRIORITY_COLORS[task.priority]} variant="light" leftSection={<IconFlag size={10} />}>
                  {t(`tasks.priority${task.priority.charAt(0).toUpperCase()}${task.priority.slice(1)}`)}
                </Badge>
              : <Text size="xs" c="dimmed">—</Text>}
          </div>
        )}
      </Table.Td>
    )
  }

  function KanbanCell({ task }: { task: Task }) {
    const editing = isEditing(task.id, 'kanbanStatus')
    return (
      <Table.Td style={{ ...cellStyle, minWidth: 120 }}>
        {editing ? (
          <Select
            autoFocus
            size="xs"
            value={task.kanbanStatus}
            allowDeselect={false}
            data={[
              { value: 'backlog',     label: t('kanban.backlog') },
              { value: 'in_progress', label: t('kanban.inProgress') },
              { value: 'done',        label: t('kanban.done') }
            ]}
            onChange={(v) => void save(task.id, { kanbanStatus: (v ?? 'backlog') as Task['kanbanStatus'] })}
            onBlur={cancelEdit}
          />
        ) : (
          <div style={clickable} onClick={() => setEditingCell({ taskId: task.id, col: 'kanbanStatus' })}>
            <Badge size="xs" color={KANBAN_COLORS[task.kanbanStatus]} variant="light">
              {t(`kanban.${task.kanbanStatus === 'in_progress' ? 'inProgress' : task.kanbanStatus}`)}
            </Badge>
          </div>
        )}
      </Table.Td>
    )
  }

  function TagsCell({ task }: { task: Task }) {
    const [opened, setOpened] = useState(false)
    const taskTags = task.tagIds.map((id) => tagById.get(id)).filter(Boolean)
    return (
      <Table.Td style={{ ...cellStyle, minWidth: 140 }}>
        <Popover opened={opened} onClose={() => setOpened(false)} withinPortal>
          <Popover.Target>
            <div style={{ ...clickable, minWidth: 60 }} onClick={() => setOpened(true)}>
              {taskTags.length > 0
                ? <Group gap={4} wrap="wrap">
                    {taskTags.map((tg) => tg && (
                      <Badge key={tg.id} size="xs" variant="outline" leftSection={<ColorDot color={tg.color} />}>
                        {tg.name}
                      </Badge>
                    ))}
                  </Group>
                : <Text size="xs" c="dimmed">—</Text>}
            </div>
          </Popover.Target>
          <Popover.Dropdown p="xs">
            <MultiSelect
              autoFocus
              size="xs"
              w={220}
              value={task.tagIds}
              data={tags.map((tg) => ({ value: tg.id, label: tg.name }))}
              onChange={(v) => void updateTask(task.id, { tagIds: v })}
              onBlur={() => setOpened(false)}
              placeholder={t('tasks.tags')}
            />
          </Popover.Dropdown>
        </Popover>
      </Table.Td>
    )
  }

  function DueDateCell({ task }: { task: Task }) {
    const editing = isEditing(task.id, 'dueDate')
    const isOverdue = task.dueDate && dayjs(task.dueDate).isBefore(dayjs(), 'day') && !task.isDone
    return (
      <Table.Td style={{ ...cellStyle, minWidth: 130 }}>
        {editing ? (
          <DateInput
            autoFocus
            size="xs"
            value={task.dueDate ? new Date(task.dueDate) : null}
            clearable
            valueFormat="DD.MM.YYYY"
            onChange={(date) => void save(task.id, { dueDate: date ? dayjs(date).format('YYYY-MM-DD') : null })}
            onBlur={cancelEdit}
          />
        ) : (
          <Text
            size="xs"
            c={isOverdue ? 'red' : undefined}
            style={clickable}
            onClick={() => setEditingCell({ taskId: task.id, col: 'dueDate' })}
          >
            {task.dueDate ? dayjs(task.dueDate).format('DD.MM.YYYY') : <Text size="xs" c="dimmed" span>—</Text>}
          </Text>
        )}
      </Table.Td>
    )
  }

  function EstimateCell({ task }: { task: Task }) {
    const editing = isEditing(task.id, 'estimate')
    return (
      <Table.Td style={cellStyle}>
        {editing ? (
          <TextInput
            autoFocus
            size="xs"
            variant="filled"
            placeholder="HH:MM"
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            onBlur={() => saveEstimate(task.id, draft)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEstimate(task.id, draft)
              if (e.key === 'Escape') cancelEdit()
            }}
            w={80}
          />
        ) : (
          <Text
            size="xs" ff="monospace" style={clickable}
            onClick={() => startEdit(task.id, 'estimate', task.timeEstimateMinutes != null ? minutesToHHMM(task.timeEstimateMinutes) : '')}
          >
            {task.timeEstimateMinutes != null
              ? minutesToHHMM(task.timeEstimateMinutes)
              : <Text size="xs" c="dimmed" span>—</Text>}
          </Text>
        )}
      </Table.Td>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────

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
          value={filterProject}
          onChange={setFilterProject}
          clearable
          data={projects.map((p) => ({ value: p.id, label: p.name }))}
          w={160}
        />
        <MultiSelect
          placeholder={t('tasks.priority')}
          value={filterPriorities}
          onChange={(v) => setFilterPriorities(v as TaskPriority[])}
          data={(['high', 'medium', 'low', 'none'] as TaskPriority[]).map((p) => ({
            value: p,
            label: t(`tasks.priority${p.charAt(0).toUpperCase()}${p.slice(1)}`)
          }))}
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
            <Chip value="all"    size="sm">{t('table.statusAll')}</Chip>
            <Chip value="active" size="sm">{t('table.statusActive')}</Chip>
            <Chip value="done"   size="sm">{t('table.statusDone')}</Chip>
          </Group>
        </Chip.Group>
      </Group>

      <Text size="xs" c="dimmed">{filtered.length} {t('table.rows')}</Text>

      <ScrollArea>
        <Table
          withTableBorder withColumnBorders highlightOnHover
          style={{ minWidth: 900 }}
          styles={{ td: { verticalAlign: 'middle' } }}
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={36} />
              <HeaderCell col="title"     label={t('tasks.title')}     sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <HeaderCell col="project"   label={t('tasks.project')}   sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <HeaderCell col="priority"  label={t('tasks.priority')}  sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <HeaderCell col="kanban"    label={t('table.status')}    sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <Table.Th style={{ whiteSpace: 'nowrap' }}><Text size="sm" fw={600}>{t('tasks.tags')}</Text></Table.Th>
              <HeaderCell col="dueDate"   label={t('tasks.dueDate')}   sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <HeaderCell col="estimate"  label={t('tasks.estimate')}  sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <HeaderCell col="timeSpent" label={t('tasks.timeSpent')} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <Table.Th w={72} />
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {filtered.map((task) => {
              const isTracking   = activeEntry?.taskId === task.id
              const totalSeconds = task.timeSpentSeconds + (isTracking ? elapsedSecs : 0)
              return (
                <Table.Tr key={task.id} style={{ opacity: task.isDone ? 0.65 : 1 }}>
                  {/* Checkbox */}
                  <Table.Td style={{ ...cellStyle, textAlign: 'center' }}>
                    <Checkbox
                      checked={task.isDone}
                      onChange={() => void toggleDone(task.id)}
                      aria-label={t('tasks.markDone')}
                    />
                  </Table.Td>

                  <TitleCell    task={task} />
                  <ProjectCell  task={task} />
                  <PriorityCell task={task} />
                  <KanbanCell   task={task} />
                  <TagsCell     task={task} />
                  <DueDateCell  task={task} />
                  <EstimateCell task={task} />

                  {/* Time spent (read-only) */}
                  <Table.Td style={cellStyle}>
                    {totalSeconds > 0
                      ? <Text size="xs" ff="monospace" c={isTracking ? 'red' : undefined} fw={isTracking ? 700 : undefined}>
                          {formatDuration(totalSeconds)}
                        </Text>
                      : <Text size="xs" c="dimmed">—</Text>}
                  </Table.Td>

                  {/* Actions */}
                  <Table.Td style={cellStyle}>
                    <Group gap={4} wrap="nowrap">
                      <ActionIcon size="sm" variant="subtle" color="gray"
                        onClick={() => void archiveTask(task.id)} title={t('tasks.archive')}>
                        <IconArchive size={14} />
                      </ActionIcon>
                      <ActionIcon size="sm" variant="subtle" color="red"
                        onClick={() => void deleteTask(task.id)} title={t('common.delete')}>
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              )
            })}

            {/* New task row */}
            <Table.Tr style={{ background: 'var(--mantine-color-default-hover)' }}>
              <Table.Td style={cellStyle} />
              <Table.Td style={{ ...cellStyle, minWidth: 200 }} colSpan={8}>
                <TextInput
                  ref={newTitleRef}
                  size="xs"
                  variant="unstyled"
                  placeholder={t('table.newTaskPlaceholder')}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.currentTarget.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleCreateTask() }}
                  leftSection={<IconPlus size={14} opacity={0.5} />}
                />
              </Table.Td>
              <Table.Td style={cellStyle}>
                {newTitle.trim() && (
                  <ActionIcon size="sm" variant="light" color="blue"
                    onClick={() => void handleCreateTask()}>
                    <IconPlus size={14} />
                  </ActionIcon>
                )}
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Stack>
  )
}
