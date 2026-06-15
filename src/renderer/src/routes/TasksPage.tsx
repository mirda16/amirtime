import { useState } from 'react'
import { Button, Group, Stack, Title } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import type { Task } from '@shared/types'
import { TaskFormModal } from '../components/tasks/TaskFormModal'
import { TaskList } from '../components/tasks/TaskList'
import { useProjectsStore } from '../stores/projectsStore'
import { useTagsStore } from '../stores/tagsStore'
import { useTasksStore } from '../stores/tasksStore'
import { useUiFilterStore } from '../stores/uiFilterStore'

export default function TasksPage() {
  const { t } = useTranslation()
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

  const filteredTasks = tasks.filter((task) => {
    if (selectedProjectId && task.projectId !== selectedProjectId) return false
    if (selectedTagId && !task.tagIds.includes(selectedTagId)) return false
    return true
  })

  const title = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)?.name ?? t('nav.allTasks')
    : t('nav.allTasks')

  const openCreate = () => {
    setEditingTask(null)
    setModalOpened(true)
  }

  const openEdit = (task: Task) => {
    setEditingTask(task)
    setModalOpened(true)
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
      <TaskList
        tasks={filteredTasks}
        projects={projects}
        tags={tags}
        onToggleDone={toggleDone}
        onOpen={openEdit}
        onDelete={deleteTask}
        onReorder={handleReorder}
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
