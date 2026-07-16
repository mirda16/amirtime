import { Modal } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import type { KanbanStatus, Task } from '@shared/types'
import { TaskCreateFields } from './TaskCreateFields'
import { TaskEditFields } from './TaskEditFields'

interface TaskFormModalProps {
  opened: boolean
  onClose: () => void
  task: Task | null
  defaultProjectId?: string | null
  defaultKanbanStatus?: KanbanStatus
}

export function TaskFormModal({ opened, onClose, task, defaultProjectId, defaultKanbanStatus }: TaskFormModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={task ? t('tasks.editTask') : t('tasks.newTask')}
      size="lg"
    >
      {task ? (
        <TaskEditFields task={task} onClose={onClose} />
      ) : (
        <TaskCreateFields onClose={onClose} defaultProjectId={defaultProjectId} defaultKanbanStatus={defaultKanbanStatus} />
      )}
    </Modal>
  )
}
