import { useRef, useState } from 'react'
import { ActionIcon, Checkbox, Group, Stack, Text, TextInput } from '@mantine/core'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useTasksStore } from '../../stores/tasksStore'

interface SubtaskListProps {
  taskId: string
}

export function SubtaskList({ taskId }: SubtaskListProps) {
  const subtasks = useTasksStore((s) => s.tasks.find((t) => t.id === taskId)?.subtasks ?? [])
  const { t } = useTranslation()
  const createSubtask = useTasksStore((s) => s.createSubtask)
  const updateSubtask = useTasksStore((s) => s.updateSubtask)
  const deleteSubtask = useTasksStore((s) => s.deleteSubtask)
  const [newTitle, setNewTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdd = async () => {
    const title = newTitle.trim()
    if (!title) return
    setNewTitle('')
    await createSubtask(taskId, { title })
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void handleAdd()
  }

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        {t('tasks.subtasks')}
        {subtasks.length > 0 && (
          <Text span size="xs" c="dimmed" ml={6}>
            {subtasks.filter((s) => s.isDone).length}/{subtasks.length}
          </Text>
        )}
      </Text>

      {subtasks.map((subtask) => (
        <Group key={subtask.id} gap="xs" wrap="nowrap">
          <Checkbox
            checked={subtask.isDone}
            onChange={(e) =>
              void updateSubtask(subtask.id, taskId, { isDone: e.currentTarget.checked })
            }
          />
          <TextInput
            style={{ flex: 1 }}
            size="xs"
            variant="unstyled"
            value={subtask.title}
            onChange={(e) => void updateSubtask(subtask.id, taskId, { title: e.currentTarget.value })}
            styles={{ input: { textDecoration: subtask.isDone ? 'line-through' : undefined } }}
          />
          <ActionIcon
            size="xs"
            variant="subtle"
            color="red"
            onClick={() => void deleteSubtask(subtask.id, taskId)}
          >
            <IconTrash size={12} />
          </ActionIcon>
        </Group>
      ))}

      <Group gap="xs">
        <TextInput
          ref={inputRef}
          style={{ flex: 1 }}
          size="xs"
          placeholder={t('tasks.addSubtask')}
          value={newTitle}
          onChange={(e) => setNewTitle(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        <ActionIcon size="sm" variant="subtle" onClick={() => void handleAdd()} disabled={!newTitle.trim()}>
          <IconPlus size={14} />
        </ActionIcon>
      </Group>
    </Stack>
  )
}
