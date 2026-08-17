import { useMemo, useState } from 'react'
import { Divider, Stack, Text, Title } from '@mantine/core'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { Task } from '@shared/types'
import { TaskFormModal } from '../components/tasks/TaskFormModal'
import { TaskList } from '../components/tasks/TaskList'
import { usePomodoroStore } from '../stores/pomodoroStore'
import { useProjectsStore } from '../stores/projectsStore'
import { useTagsStore } from '../stores/tagsStore'
import { useTasksStore } from '../stores/tasksStore'

export default function TodayPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const startForTask = usePomodoroStore((s) => s.startForTask)
  const tasks = useTasksStore((s) => s.tasks)
  const toggleDone = useTasksStore((s) => s.toggleDone)
  const deleteTask = useTasksStore((s) => s.deleteTask)
  const projects = useProjectsStore((s) => s.projects)
  const tags = useTagsStore((s) => s.tags)

  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const today = dayjs().format('YYYY-MM-DD')
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')

  const { overdue, todayTasks, tomorrowTasks } = useMemo(() => {
    const overdue: Task[] = []
    const todayTasks: Task[] = []
    const tomorrowTasks: Task[] = []

    for (const task of tasks) {
      if (task.isDone) continue
      const isScheduledToday = task.scheduledAt?.startsWith(today)
      const isDueToday = task.dueDate === today
      const isOverdue = task.dueDate && task.dueDate < today
      const isScheduledTomorrow = task.scheduledAt?.startsWith(tomorrow)
      const isDueTomorrow = task.dueDate === tomorrow

      if (isScheduledToday || isDueToday) {
        todayTasks.push(task)
      } else if (isOverdue) {
        overdue.push(task)
      } else if (isScheduledTomorrow || isDueTomorrow) {
        tomorrowTasks.push(task)
      }
    }

    return { overdue, todayTasks, tomorrowTasks }
  }, [tasks, today, tomorrow])

  const handleStartPomodoro = (taskId: string) => {
    startForTask(taskId)
    void navigate('/pomodoro')
  }

  const sharedListProps = {
    projects,
    tags,
    onToggleDone: toggleDone,
    onOpen: setEditingTask,
    onDelete: deleteTask,
    onReorder: () => {},
    onStartPomodoro: handleStartPomodoro
  }

  const isEmpty = overdue.length === 0 && todayTasks.length === 0 && tomorrowTasks.length === 0

  return (
    <Stack gap="md">
      <Title order={2}>{t('nav.today')}</Title>

      {isEmpty && (
        <Text c="dimmed" ta="center" py="xl">
          {t('today.noTasks')}
        </Text>
      )}

      {overdue.length > 0 && (
        <Stack gap="xs">
          <Divider label={<Text size="xs" c="red" fw={600}>{t('today.overdue')}</Text>} labelPosition="left" />
          <TaskList tasks={overdue} {...sharedListProps} />
        </Stack>
      )}

      {todayTasks.length > 0 && (
        <Stack gap="xs">
          {overdue.length > 0 && (
            <Divider label={<Text size="xs" c="dimmed" fw={600}>{t('today.today')}</Text>} labelPosition="left" />
          )}
          <TaskList tasks={todayTasks} {...sharedListProps} />
        </Stack>
      )}

      {tomorrowTasks.length > 0 && (
        <Stack gap="xs" mt="sm">
          <Divider label={<Text size="xs" c="dimmed" fw={600}>{t('today.tomorrow')}</Text>} labelPosition="left" />
          <TaskList tasks={tomorrowTasks} {...sharedListProps} />
        </Stack>
      )}

      <TaskFormModal
        opened={editingTask !== null}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        defaultProjectId={null}
      />
    </Stack>
  )
}
