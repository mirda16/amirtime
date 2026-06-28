import { useRef, useState } from 'react'
import { Button, Group, Select, Stack, TextInput, Title } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { IconPlus, IconSearch } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { Task } from '@shared/types'
import { TaskFormModal } from '../components/tasks/TaskFormModal'
import { TaskList } from '../components/tasks/TaskList'
import { useProjectsStore } from '../stores/projectsStore'
import { usePomodoroStore } from '../stores/pomodoroStore'
import { useTagsStore } from '../stores/tagsStore'
import { useTasksStore } from '../stores/tasksStore'
import { useUiFilterStore } from '../stores/uiFilterStore'
import { PRIORITY_ORDER } from '../utils/priority'

type SortKey = 'default' | 'priority' | 'dueDate' | 'timeSpent'

export default function TasksPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const startForTask = usePomodoroStore((s) => s.startForTask)
  const tasks = useTasksStore((s) => s.tasks)
  const toggleDone = useTasksStore((s) => s.toggleDone)
  const deleteTask = useTasksStore((s) => s.deleteTask)
  const reorderTasks = useTasksStore((s) => s.reorderTasks)
  const projects = useProjectsStore((s) => s.projects)
  const tags = useTagsStore((s) => s.tags)
  const selectedProjectId = useUiFilterStore((s) => s.selectedProjectId)
  const selectedTagId = useUiFilterStore((s) => s.selectedTagId)

  const [modalOpened, setModalOpened] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('default')
  const searchRef = useRef<HTMLInputElement>(null)

  const openCreate = () => {
    setEditingTask(null)
    setModalOpened(true)
  }

  const openEdit = (task: Task) => {
    setEditingTask(task)
    setModalOpened(true)
  }

  useHotkeys([
    ['n', openCreate],
    ['/', () => searchRef.current?.focus()]
  ])

  const filteredTasks = tasks
    .filter((task) => {
      if (selectedProjectId && task.projectId !== selectedProjectId) return false
      if (selectedTagId && !task.tagIds.includes(selectedTagId)) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          task.title.toLowerCase().includes(q) ||
          (task.description?.toLowerCase().includes(q) ?? false)
        )
      }
      return true
    })
    .sort((a, b) => {
      switch (sortKey) {
        case 'priority':
          return PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
        case 'dueDate': {
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return a.dueDate.localeCompare(b.dueDate)
        }
        case 'timeSpent':
          return b.timeSpentSeconds - a.timeSpentSeconds
        default:
          return a.sortOrder - b.sortOrder
      }
    })

  const title = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)?.name ?? t('nav.allTasks')
    : t('nav.allTasks')

  const handleStartPomodoro = (taskId: string) => {
    startForTask(taskId)
    void navigate('/pomodoro')
  }

  const handleReorder = (newFilteredIds: string[]) => {
    const activeIds = tasks.filter((task) => !task.isDone).map((task) => task.id)
    const filteredIdSet = new Set(newFilteredIds)
    let i = 0
    const newGlobalOrder = activeIds.map((id) => (filteredIdSet.has(id) ? newFilteredIds[i++] : id))
    void reorderTasks(newGlobalOrder)
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>{title}</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          {t('tasks.newTask')}
        </Button>
      </Group>
      <Group>
        <TextInput
          ref={searchRef}
          placeholder={t('tasks.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          style={{ flex: 1 }}
          onKeyDown={(e) => e.key === 'Escape' && setSearchQuery('')}
        />
        <Select
          value={sortKey}
          onChange={(v) => setSortKey((v as SortKey) ?? 'default')}
          data={[
            { value: 'default', label: t('tasks.sortDefault') },
            { value: 'priority', label: t('tasks.sortPriority') },
            { value: 'dueDate', label: t('tasks.sortDueDate') },
            { value: 'timeSpent', label: t('tasks.sortTimeSpent') }
          ]}
          allowDeselect={false}
          w={170}
        />
      </Group>
      <TaskList
        tasks={filteredTasks}
        projects={projects}
        tags={tags}
        onToggleDone={toggleDone}
        onOpen={openEdit}
        onDelete={deleteTask}
        onReorder={sortKey === 'default' ? handleReorder : () => {}}
        onStartPomodoro={handleStartPomodoro}
      />
      <TaskFormModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        task={editingTask}
        defaultProjectId={selectedProjectId}
      />
    </Stack>
  )
}
