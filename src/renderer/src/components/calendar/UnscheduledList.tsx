import { Stack, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import type { Project, Task } from '@shared/types'
import { UnscheduledTaskCard } from './UnscheduledTaskCard'

interface UnscheduledListProps {
  tasks: Task[]
  projectById: Map<string, Project>
  onOpen: (task: Task) => void
}

export function UnscheduledList({ tasks, projectById, onOpen }: UnscheduledListProps) {
  const { t } = useTranslation()

  return (
    <Stack gap="xs" w={200} style={{ flexShrink: 0 }}>
      <Text size="sm" fw={600}>
        {t('calendar.unscheduled')}
      </Text>
      {tasks.length === 0 && (
        <Text size="xs" c="dimmed">
          {t('calendar.noUnscheduled')}
        </Text>
      )}
      {tasks.map((task) => (
        <UnscheduledTaskCard
          key={task.id}
          task={task}
          project={task.projectId ? projectById.get(task.projectId) : undefined}
          onOpen={() => onOpen(task)}
        />
      ))}
    </Stack>
  )
}
