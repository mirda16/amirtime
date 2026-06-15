import { useState } from 'react'
import {
  Button,
  Group,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Textarea,
  TextInput
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useTranslation } from 'react-i18next'
import { useProjectsStore } from '../../stores/projectsStore'
import { useTagsStore } from '../../stores/tagsStore'
import { useTasksStore } from '../../stores/tasksStore'

interface TaskCreateFieldsProps {
  onClose: () => void
  defaultProjectId?: string | null
}

export function TaskCreateFields({ onClose, defaultProjectId }: TaskCreateFieldsProps) {
  const { t } = useTranslation()
  const projects = useProjectsStore((s) => s.projects)
  const tags = useTagsStore((s) => s.tags)
  const createTask = useTasksStore((s) => s.createTask)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState<string | null>(defaultProjectId ?? null)
  const [tagIds, setTagIds] = useState<string[]>([])
  const [dueDate, setDueDate] = useState<string | null>(null)
  const [estimate, setEstimate] = useState<number | ''>('')

  const handleCreate = async () => {
    if (!title.trim()) return
    await createTask({
      title: title.trim(),
      description: description || null,
      projectId,
      tagIds,
      dueDate,
      timeEstimateMinutes: estimate === '' ? null : Number(estimate)
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
      <Select
        label={t('tasks.project')}
        placeholder={t('tasks.noProject')}
        clearable
        value={projectId}
        onChange={setProjectId}
        data={projects.map((p) => ({ value: p.id, label: p.name }))}
      />
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
        />
        <NumberInput
          label={t('tasks.estimate')}
          value={estimate}
          onChange={(value) => setEstimate(value === '' ? '' : Number(value))}
          min={0}
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
