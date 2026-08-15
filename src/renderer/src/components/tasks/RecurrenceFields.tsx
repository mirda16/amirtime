import { Chip, Group, NumberInput, Select, Stack, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import type { RecurrenceRule, RecurrenceType } from '@shared/types'

interface RecurrenceFieldsProps {
  value: RecurrenceRule | null
  onChange: (rule: RecurrenceRule | null) => void
}

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] // 0=Sun … 6=Sat

export function RecurrenceFields({ value, onChange }: RecurrenceFieldsProps) {
  const { t } = useTranslation()
  const typeValue = value?.type ?? 'none'

  const handleTypeChange = (raw: string | null) => {
    const type = (raw ?? 'none') as RecurrenceType | 'none'
    if (type === 'none') {
      onChange(null)
    } else if (type === 'daily') {
      onChange({ type: 'daily' })
    } else if (type === 'weekly') {
      onChange({ type: 'weekly', weekdays: value?.type === 'weekly' ? (value.weekdays ?? [1, 2, 3, 4, 5]) : [1, 2, 3, 4, 5] })
    } else if (type === 'monthly') {
      onChange({ type: 'monthly', monthDay: value?.type === 'monthly' ? (value.monthDay ?? 1) : 1 })
    } else if (type === 'interval') {
      onChange({ type: 'interval', days: value?.type === 'interval' ? (value.days ?? 7) : 7 })
    }
  }

  const handleWeekdayToggle = (day: number) => {
    if (!value || value.type !== 'weekly') return
    const current = value.weekdays ?? []
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => a - b)
    // keep at least one weekday selected
    onChange({ ...value, weekdays: next.length ? next : [day] })
  }

  const handleIntervalChange = (days: number | string) => {
    if (!value || value.type !== 'interval') return
    onChange({ ...value, days: typeof days === 'number' && days >= 1 ? days : 1 })
  }

  const handleMonthDayChange = (day: number | string) => {
    if (!value || value.type !== 'monthly') return
    onChange({ ...value, monthDay: typeof day === 'number' && day >= 1 ? day : 1 })
  }

  return (
    <Stack gap="xs">
      <Select
        label={t('tasks.recurrence')}
        value={typeValue}
        onChange={handleTypeChange}
        allowDeselect={false}
        data={[
          { value: 'none', label: t('tasks.recurrenceNone') },
          { value: 'daily', label: t('tasks.recurrenceDaily') },
          { value: 'weekly', label: t('tasks.recurrenceWeekly') },
          { value: 'monthly', label: t('tasks.recurrenceMonthly') },
          { value: 'interval', label: t('tasks.recurrenceInterval') }
        ]}
      />

      {value?.type === 'interval' && (
        <NumberInput
          label={t('tasks.recurrenceIntervalDays')}
          value={value.days ?? 7}
          onChange={handleIntervalChange}
          min={1}
          max={365}
          suffix={` ${t('settings.days')}`}
        />
      )}

      {value?.type === 'weekly' && (
        <div>
          <Text size="sm" fw={500} mb={4}>
            {t('tasks.recurrenceWeekdays')}
          </Text>
          <Chip.Group multiple value={(value.weekdays ?? []).map(String)} onChange={(vals) => {
            const days = vals.map(Number).sort((a, b) => a - b)
            onChange({ ...value, weekdays: days.length ? days : value.weekdays ?? [1] })
          }}>
            <Group gap={4}>
              {WEEKDAYS.map((day) => (
                <Chip key={day} value={String(day)} size="xs">
                  {t(`settings.day${day}`)}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </div>
      )}

      {value?.type === 'monthly' && (
        <NumberInput
          label={t('tasks.recurrenceMonthDay')}
          value={value.monthDay ?? 1}
          onChange={handleMonthDayChange}
          min={1}
          max={31}
          suffix={`.`}
        />
      )}
    </Stack>
  )
}
