import { useState } from 'react'
import {
  Button,
  Divider,
  Group,
  MultiSelect,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput
} from '@mantine/core'
import { DateInput, TimeInput } from '@mantine/dates'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import type { KanbanStatus, RecurrenceRule, TaskPriority } from '@shared/types'
import { parseTimeInput } from '../../utils/formatDuration'
import { ColorPickerPopover } from '../common/ColorPickerPopover'
import { useProjectsStore } from '../../stores/projectsStore'
import { useTagsStore } from '../../stores/tagsStore'
import { useTasksStore } from '../../stores/tasksStore'
import { RecurrenceFields } from './RecurrenceFields'

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
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(null)
  const [scheduledDate, setScheduledDate] = useState<string | null>(null)
  const [scheduledTimeStart, setScheduledTimeStart] = useState('')
  const [scheduledTimeEnd, setScheduledTimeEnd] = useState('')

  const buildScheduledAt = (date: string | null, hhmm: string): string | null => {
    if (!hhmm) return null
    const base = date ? dayjs(date) : dayjs()
    const [hh, mm] = hhmm.split(':').map(Number)
    return base.hour(hh).minute(mm).second(0).millisecond(0).toISOString()
  }

  const handleCreate = async () => {
    if (!title.trim()) return
    const anchorDate = recurrenceRule ? null : scheduledDate
    await createTask({
      title: title.trim(),
      description: description || null,
      projectId,
      color,
      priority,
      tagIds,
      dueDate,
      timeEstimateMinutes: estimate.trim() === '' ? null : parseTimeInput(estimate),
      kanbanStatus: defaultKanbanStatus,
      recurrenceRule,
      scheduledAt: buildScheduledAt(anchorDate, scheduledTimeStart),
      scheduledEnd: buildScheduledAt(anchorDate, scheduledTimeEnd)
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
      <Divider label={<Text size="xs" c="dimmed">{t('tasks.scheduledSection')}</Text>} labelPosition="left" />
      <Group wrap="wrap">
        {!recurrenceRule && (
          <DateInput
            label={t('tasks.scheduledDate')}
            value={scheduledDate}
            onChange={setScheduledDate}
            clearable
            valueFormat="DD.MM.YYYY"
            highlightToday
            style={{ flex: 1, minWidth: 120 }}
          />
        )}
        <TimeInput
          label={t('tasks.scheduledTimeStart')}
          value={scheduledTimeStart}
          onChange={(e) => setScheduledTimeStart(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 90 }}
        />
        <TimeInput
          label={t('tasks.scheduledTimeEnd')}
          value={scheduledTimeEnd}
          onChange={(e) => setScheduledTimeEnd(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 90 }}
        />
      </Group>
      <RecurrenceFields value={recurrenceRule} onChange={setRecurrenceRule} />
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
