import { useState } from 'react'
import {
  Button,
  Group,
  MultiSelect,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useTranslation } from 'react-i18next'
import type { TaskPriority } from '@shared/types'
import { hhmmToMinutes } from '../../utils/formatDuration'
import type { KanbanStatus } from '@shared/types'
import { ColorPickerPopover } from '../common/ColorPickerPopover'
import { useProjectsStore } from '../../stores/projectsStore'
import { useTagsStore } from '../../stores/tagsStore'
import { useTasksStore } from '../../stores/tasksStore'

interface TaskCreateFieldsProps {
  onClose: () => void
  defaultProjectId?: string | null
  defaultKanbanStatus?: KanbanStatus
}

export function TaskCreateFields({ onClose, defaultProjectId, defaultKanbanStatus }: TaskCreateFieldsProps) {
  const { t } = useTranslation()
  const projects = useProjectsStore((s) => s.projects)
  const tags = useTagsStore((s) => s.tags)
  const createTask = useTasksStore((s) => s.createTask)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState<string | null>(defaultProjectId ?? null)
  const [tagIds, setTagIds] = useState<string[]>([])
  const [dueDate, setDueDate] = useState<string | null>(null)
  const [estimate, setEstimate] = useState('')
  const [color, setColor] = useState<string | null>(null)
  const [priority, setPriority] = useState<TaskPriority>('none')

  const handleCreate = async () => {
    if (!title.trim()) return
    await createTask({
      title: title.trim(),
      description: description || null,
      projectId,
      color,
      priority,
      tagIds,
      dueDate,
      timeEstimateMinutes: estimate === '' ? null : hhmmToMinutes(estimate),
      kanbanStatus: defaultKanbanStatus
    })
    onClose()
  }

  return (
    <Stack>
      <TextInput
        label={t('tasks.title')}
        placeholder={t('tasks.titlePlaceholder')}
        value={title}
        onChange={(e) => setTitle(e.currentTarget.value)}
        data-autofocus
        required
      />
      <Textarea
        label={t('tasks.description')}
        placeholder={t('tasks.descriptionPlaceholder')}
        value={description}
        onChange={(e) => setDescription(e.currentTarget.value)}
        minRows={2}
        autosize
      />
      <Group align="flex-end">
        <Select
          style={{ flex: 1 }}
          label={t('tasks.project')}
          placeholder={t('tasks.noProject')}
          clearable
          value={projectId}
          onChange={setProjectId}
          data={projects.map((p) => ({ value: p.id, label: p.name }))}
        />
        <div>
          <Text size="sm" fw={500} mb={4}>
            {t('common.color')}
          </Text>
          <ColorPickerPopover color={color} onChange={setColor} />
        </div>
      </Group>
      <MultiSelect
        label={t('tasks.tags')}
        value={tagIds}
        onChange={setTagIds}
        data={tags.map((tg) => ({ value: tg.id, label: tg.name }))}
      />
      <Group grow>
        <DateInput
          label={t('tasks.dueDate')}
          value={dueDate}
          onChange={setDueDate}
          clearable
          valueFormat="DD.MM.YYYY"
          highlightToday
        />
        <TextInput
          label={t('tasks.estimate')}
          value={estimate}
          onChange={(e) => setEstimate(e.currentTarget.value)}
          placeholder="HH:MM"
          ff="monospace"
        />
        <Select
          label={t('tasks.priority')}
          value={priority}
          onChange={(value) => setPriority((value ?? 'none') as TaskPriority)}
          data={[
            { value: 'none', label: t('tasks.priorityNone') },
            { value: 'low', label: t('tasks.priorityLow') },
            { value: 'medium', label: t('tasks.priorityMedium') },
            { value: 'high', label: t('tasks.priorityHigh') }
          ]}
          allowDeselect={false}
        />
      </Group>
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>
          {t('common.close')}
        </Button>
        <Button onClick={handleCreate} disabled={!title.trim()}>
          {t('common.add')}
        </Button>
      </Group>
    </Stack>
  )
}
