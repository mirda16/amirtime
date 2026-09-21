import { useEffect, useState } from 'react'
import {
  ActionIcon,
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
import { IconX } from '@tabler/icons-react'
import {
  parseTimeInput,
  hhmmToSeconds,
  minutesToHHMM,
  secondsToHHMM
} from '../../utils/formatDuration'
import dayjs from 'dayjs'

// Extract HH:MM string from an ISO datetime string, or '' if null
function isoToHHMM(iso: string | null): string {
  if (!iso) return ''
  const d = dayjs(iso)
  return `${String(d.hour()).padStart(2, '0')}:${String(d.minute()).padStart(2, '0')}`
}

// Combine a date string (YYYY-MM-DD or ISO) with HH:MM into an ISO datetime
function buildIso(dateIso: string | null, hhmm: string): string | null {
  if (!hhmm) return null
  const base = dateIso ? dayjs(dateIso) : dayjs()
  const [hh, mm] = hhmm.split(':').map(Number)
  return base.hour(hh).minute(mm).second(0).millisecond(0).toISOString()
}
import { DateInput, TimeInput } from '@mantine/dates'
import { useDebouncedCallback } from '@mantine/hooks'
import { useTranslation } from 'react-i18next'
import type { RecurrenceRule, Task, TaskPriority, UpdateTaskInput } from '@shared/types'
import { ColorPickerPopover } from '../common/ColorPickerPopover'
import { SubtaskList } from './SubtaskList'
import { TaskComments } from './TaskComments'
import { useProjectsStore } from '../../stores/projectsStore'
import { useTagsStore } from '../../stores/tagsStore'
import { useTasksStore } from '../../stores/tasksStore'
import { RecurrenceFields } from './RecurrenceFields'

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
  const [estimate, setEstimate] = useState(task.timeEstimateMinutes != null ? minutesToHHMM(task.timeEstimateMinutes) : '')
  const [color, setColor] = useState<string | null>(task.color)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [timeSpent, setTimeSpent] = useState(secondsToHHMM(task.timeSpentSeconds))
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(task.recurrenceRule)
  // Scheduled date (YYYY-MM-DD) — not shown for recurring tasks (day comes from recurrence rule)
  const [scheduledDate, setScheduledDate] = useState<string | null>(
    task.scheduledAt ? dayjs(task.scheduledAt).format('YYYY-MM-DD') : null
  )
  const [scheduledTimeStart, setScheduledTimeStart] = useState(isoToHHMM(task.scheduledAt))
  const [scheduledTimeEnd, setScheduledTimeEnd] = useState(isoToHHMM(task.scheduledEnd))

  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description ?? '')
    setProjectId(task.projectId)
    setTagIds(task.tagIds)
    setDueDate(task.dueDate ?? null)
    setEstimate(task.timeEstimateMinutes != null ? minutesToHHMM(task.timeEstimateMinutes) : '')
    setColor(task.color)
    setPriority(task.priority)
    setTimeSpent(secondsToHHMM(task.timeSpentSeconds))
    setRecurrenceRule(task.recurrenceRule)
    setScheduledDate(task.scheduledAt ? dayjs(task.scheduledAt).format('YYYY-MM-DD') : null)
    setScheduledTimeStart(isoToHHMM(task.scheduledAt))
    setScheduledTimeEnd(isoToHHMM(task.scheduledEnd))
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

  const handleEstimateBlur = () => {
    if (estimate.trim() === '') {
      void updateTask(task.id, { timeEstimateMinutes: null })
    } else {
      const minutes = parseTimeInput(estimate)
      if (minutes !== null && minutes > 0) {
        setEstimate(minutesToHHMM(minutes))   // normalise display to HH:MM
        void updateTask(task.id, { timeEstimateMinutes: minutes })
      } else {
        // revert to last saved value
        setEstimate(task.timeEstimateMinutes != null ? minutesToHHMM(task.timeEstimateMinutes) : '')
      }
    }
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

  const handleRecurrenceChange = (rule: RecurrenceRule | null) => {
    setRecurrenceRule(rule)
    void updateTask(task.id, { recurrenceRule: rule })
  }

  // For recurring tasks: date anchor is today (only time matters for calendar rendering)
  const scheduledAnchorDate = recurrenceRule
    ? dayjs().format('YYYY-MM-DD')
    : scheduledDate

  const applyScheduledTime = (startHHMM: string, endHHMM: string) => {
    if (!startHHMM) {
      void updateTask(task.id, { scheduledAt: null, scheduledEnd: null })
    } else {
      void updateTask(task.id, {
        scheduledAt: buildIso(scheduledAnchorDate, startHHMM),
        scheduledEnd: endHHMM ? buildIso(scheduledAnchorDate, endHHMM) : null
      })
    }
  }

  const handleScheduledDateChange = (value: string | null) => {
    setScheduledDate(value)
    void updateTask(task.id, {
      scheduledAt: buildIso(value, scheduledTimeStart),
      scheduledEnd: scheduledTimeEnd ? buildIso(value, scheduledTimeEnd) : null
    })
  }

  const handleScheduledTimeStartChange = (hhmm: string) => {
    setScheduledTimeStart(hhmm)
    applyScheduledTime(hhmm, scheduledTimeEnd)
  }

  const handleScheduledTimeEndChange = (hhmm: string) => {
    setScheduledTimeEnd(hhmm)
    applyScheduledTime(scheduledTimeStart, hhmm)
  }

  const handleClearScheduled = () => {
    setScheduledDate(null)
    setScheduledTimeStart('')
    setScheduledTimeEnd('')
    void updateTask(task.id, { scheduledAt: null, scheduledEnd: null })
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
        <TextInput
          label={t('tasks.estimate')}
          value={estimate}
          onChange={(e) => setEstimate(e.currentTarget.value)}
          onBlur={handleEstimateBlur}
          placeholder="HH:MM"
          ff="monospace"
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
      <Divider label={<Text size="xs" c="dimmed">{t('tasks.scheduledSection')}</Text>} labelPosition="left" />
      <Stack gap="xs">
        <Group align="flex-end" wrap="wrap">
          {!recurrenceRule && (
            <DateInput
              label={t('tasks.scheduledDate')}
              value={scheduledDate}
              onChange={handleScheduledDateChange}
              clearable
              valueFormat="DD.MM.YYYY"
              highlightToday
              style={{ flex: 1, minWidth: 120 }}
            />
          )}
          <TimeInput
            label={t('tasks.scheduledTimeStart')}
            value={scheduledTimeStart}
            onChange={(e) => handleScheduledTimeStartChange(e.currentTarget.value)}
            style={{ flex: 1, minWidth: 90 }}
          />
          <TimeInput
            label={t('tasks.scheduledTimeEnd')}
            value={scheduledTimeEnd}
            onChange={(e) => handleScheduledTimeEndChange(e.currentTarget.value)}
            style={{ flex: 1, minWidth: 90 }}
          />
          {(scheduledTimeStart || scheduledDate) && (
            <ActionIcon variant="subtle" color="gray" onClick={handleClearScheduled} mb={1} title={t('tasks.scheduledClear')}>
              <IconX size={16} />
            </ActionIcon>
          )}
        </Group>
        {recurrenceRule && !scheduledTimeStart && (
          <Text size="xs" c="dimmed">{t('tasks.scheduledTimeHint')}</Text>
        )}
      </Stack>
      <RecurrenceFields value={recurrenceRule} onChange={handleRecurrenceChange} />
      <SubtaskList taskId={task.id} />
      <TaskComments taskId={task.id} />
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
