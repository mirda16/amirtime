import { Drawer } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import type { Task } from '@shared/types'
import { TaskEditFields } from './TaskEditFields'

interface TaskDetailDrawerProps {
  task: Task | null
  onClose: () => void
}

export function TaskDetailDrawer({ task, onClose }: TaskDetailDrawerProps) {
  const { t } = useTranslation()

  return (
    <Drawer
      opened={task !== null}
      onClose={onClose}
      position="right"
      title={t('tasks.editTask')}
      size="md"
    >
      {task && <TaskEditFields task={task} onClose={onClose} />}
    </Drawer>
  )
}
