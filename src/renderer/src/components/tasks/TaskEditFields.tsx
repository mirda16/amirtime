import { useEffect, useState } from 'react'
import {
  Button,
  Group,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput
} from '@mantine/core'

function secondsToHHMM(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function hhmmToSeconds(value: string): number | null {
  const match = value.match(/^(\d+):([0-5]\d)$/)
  if (!match) return null
  return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60
}
import { DateInput } from '@mantine/dates'
import { useDebouncedCallback } from '@mantine/hooks'
import { useTranslation } from 'react-i18next'
import type { Task, TaskPriority, UpdateTaskInput } from '@shared/types'
import { ColorPickerPopover } from '../common/ColorPickerPopover'
import { SubtaskList } from './SubtaskList'
import { useProjectsStore } from '../../stores/projectsStore'
import { useTagsStore } from '../../stores/tagsStore'
import { useTasksStore } from '../../stores/tasksStore'

interface TaskEditFieldsProps {
  task: Task
  onClose: () => void
}

export function TaskEditFields({ task, onClose }: TaskEditFieldsProps) {
  const { t } = useTranslation()
  const projects = useProjectsStore((s) => s.projects)
  const tags = useTagsStore((s) => s.tags)
  const updateTask = useTasksStore((s) => s.updateTask)
  const deleteTask = useTasksStore((s) => s.deleteTask)

  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [projectId, setProjectId] = useState<string | null>(task.projectId)
  const [tagIds, setTagIds] = useState<string[]>(task.tagIds)
  const [dueDate, setDueDate] = useState<string | null>(task.dueDate ?? null)
  const [estimate, setEstimate] = useState<number | ''>(task.timeEstimateMinutes ?? '')
  const [color, setColor] = useState<string | null>(task.color)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [timeSpent, setTimeSpent] = useState(secondsToHHMM(task.timeSpentSeconds))

  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description ?? '')
    setProjectId(task.projectId)
    setTagIds(task.tagIds)
    setDueDate(task.dueDate ?? null)
    setEstimate(task.timeEstimateMinutes ?? '')
    setColor(task.color)
    setPriority(task.priority)
    setTimeSpent(secondsToHHMM(task.timeSpentSeconds))
  }, [task])

  const debouncedUpdate = useDebouncedCallback((patch: UpdateTaskInput) => {
    void updateTask(task.id, patch)
  }, 500)

  const handleTitleChange = (value: string) => {
    setTitle(value)
    debouncedUpdate({ title: value })
  }

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    debouncedUpdate({ description: value || null })
  }

  const handleProjectChange = (value: string | null) => {
    setProjectId(value)
    void updateTask(task.id, { projectId: value })
  }

  const handleTagsChange = (value: string[]) => {
    setTagIds(value)
    void updateTask(task.id, { tagIds: value })
  }

  const handleDueDateChange = (value: string | null) => {
    setDueDate(value)
    void updateTask(task.id, { dueDate: value })
  }

  const handleEstimateChange = (value: number | string) => {
    const num = value === '' ? null : Number(value)
    setEstimate(value === '' ? '' : Number(value))
    void updateTask(task.id, { timeEstimateMinutes: num })
  }

  const handleColorChange = (value: string | null) => {
    setColor(value)
    void updateTask(task.id, { color: value })
  }

  const handleTimeSpentBlur = () => {
    const seconds = hhmmToSeconds(timeSpent)
    if (seconds !== null) {
      void updateTask(task.id, { timeSpentSeconds: seconds })
    } else {
      setTimeSpent(secondsToHHMM(task.timeSpentSeconds))
    }
  }

  const handlePriorityChange = (value: string | null) => {
    const next = (value ?? 'none') as TaskPriority
    setPriority(next)
    void updateTask(task.id, { priority: next })
  }

  const handleDelete = async () => {
    await deleteTask(task.id)
    onClose()
  }

  return (
    <Stack>
      <TextInput
        label={t('tasks.title')}
        placeholder={t('tasks.titlePlaceholder')}
        value={title}
        onChange={(e) => handleTitleChange(e.currentTarget.value)}
        data-autofocus
        required
      />
      <Textarea
        label={t('tasks.description')}
        placeholder={t('tasks.descriptionPlaceholder')}
        value={description}
        onChange={(e) => handleDescriptionChange(e.currentTarget.value)}
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
          onChange={handleProjectChange}
          data={projects.map((p) => ({ value: p.id, label: p.name }))}
        />
        <div>
          <Text size="sm" fw={500} mb={4}>
            {t('common.color')}
          </Text>
          <ColorPickerPopover color={color} onChange={handleColorChange} />
        </div>
      </Group>
      <MultiSelect
        label={t('tasks.tags')}
        value={tagIds}
        onChange={handleTagsChange}
        data={tags.map((tg) => ({ value: tg.id, label: tg.name }))}
      />
      <Group grow>
        <DateInput
          label={t('tasks.dueDate')}
          value={dueDate}
          onChange={handleDueDateChange}
          clearable
          valueFormat="DD.MM.YYYY"
          highlightToday
        />
        <NumberInput
          label={t('tasks.estimate')}
          value={estimate}
          onChange={handleEstimateChange}
          min={0}
        />
        <TextInput
          label={t('tasks.timeSpent')}
          value={timeSpent}
          onChange={(e) => setTimeSpent(e.currentTarget.value)}
          onBlur={handleTimeSpentBlur}
          placeholder="HH:MM"
          ff="monospace"
        />
        <Select
          label={t('tasks.priority')}
          value={priority}
          onChange={handlePriorityChange}
          data={[
            { value: 'none', label: t('tasks.priorityNone') },
            { value: 'low', label: t('tasks.priorityLow') },
            { value: 'medium', label: t('tasks.priorityMedium') },
            { value: 'high', label: t('tasks.priorityHigh') }
          ]}
          allowDeselect={false}
        />
      </Group>
      <SubtaskList taskId={task.id} />
      <Group justify="space-between" mt="md">
        <Button color="red" variant="subtle" onClick={handleDelete}>
          {t('common.delete')}
        </Button>
        <Button variant="default" onClick={onClose}>
          {t('common.close')}
        </Button>
      </Group>
    </Stack>
  )
}
