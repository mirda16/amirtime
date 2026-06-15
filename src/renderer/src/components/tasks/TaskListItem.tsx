import { ActionIcon, Badge, Checkbox, Group, Text } from '@mantine/core'
import {
  IconGripVertical,
  IconPlayerPlay,
  IconPlayerStop,
  IconTrash
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import type { HTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import type { Project, Tag, Task } from '@shared/types'
import { formatDuration } from '../../utils/formatDuration'
import { ColorDot } from '../common/ColorDot'

interface TaskListItemProps {
  task: Task
  project: Project | undefined
  tags: Tag[]
  isTracking: boolean
  elapsedSeconds: number
  onToggleDone: () => void
  onOpen: () => void
  onDelete: () => void
  onToggleTimer: () => void
  dragHandleProps?: HTMLAttributes<HTMLDivElement>
}

export function TaskListItem({
  task,
  project,
  tags,
  isTracking,
  elapsedSeconds,
  onToggleDone,
  onOpen,
  onDelete,
  onToggleTimer,
  dragHandleProps
}: TaskListItemProps) {
  const { t } = useTranslation()
  const totalSeconds = task.timeSpentSeconds + (isTracking ? elapsedSeconds : 0)

  return (
    <Group
      wrap="nowrap"
      gap="sm"
      py="xs"
      px="sm"
      style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
    >
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          style={{ cursor: 'grab', display: 'flex', color: 'var(--mantine-color-dimmed)' }}
          aria-label={t('tasks.dragHandle')}
        >
          <IconGripVertical size={16} />
        </div>
      )}
      <Checkbox checked={task.isDone} onChange={onToggleDone} aria-label={t('tasks.markDone')} />
      <div style={{ flex: 1, cursor: 'pointer', minWidth: 0 }} onClick={onOpen}>
        <Text
          fw={500}
          td={task.isDone ? 'line-through' : undefined}
          c={task.isDone ? 'dimmed' : undefined}
          truncate
        >
          {task.title}
        </Text>
        <Group gap="xs" mt={2}>
          {project && (
            <Badge size="xs" variant="light" leftSection={<ColorDot color={project.color} />}>
              {project.name}
            </Badge>
          )}
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              size="xs"
              variant="outline"
              leftSection={<ColorDot color={tag.color} />}
            >
              {tag.name}
            </Badge>
          ))}
          {task.dueDate && (
            <Badge size="xs" color="gray" variant="light">
              {dayjs(task.dueDate).format('DD.MM.YYYY')}
            </Badge>
          )}
          {task.timeEstimateMinutes != null && (
            <Badge size="xs" color="gray" variant="outline">
              {task.timeEstimateMinutes} min
            </Badge>
          )}
          {totalSeconds > 0 && (
            <Badge size="xs" color={isTracking ? 'red' : 'gray'} variant={isTracking ? 'filled' : 'outline'}>
              {formatDuration(totalSeconds)}
            </Badge>
          )}
        </Group>
      </div>
      {!task.isDone && (
        <ActionIcon
          variant="subtle"
          color={isTracking ? 'red' : 'gray'}
          onClick={onToggleTimer}
          aria-label={isTracking ? t('tasks.stopTimer') : t('tasks.startTimer')}
        >
          {isTracking ? <IconPlayerStop size={16} /> : <IconPlayerPlay size={16} />}
        </ActionIcon>
      )}
      <ActionIcon variant="subtle" color="red" onClick={onDelete} aria-label={t('common.delete')}>
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  )
}
