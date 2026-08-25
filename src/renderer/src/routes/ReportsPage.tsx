import { useEffect, useMemo, useState } from 'react'
import { BarChart } from '@mantine/charts'
import { Card, Group, SegmentedControl, Stack, Table, Text, Title } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import dayjs, { type Dayjs } from 'dayjs'
import { useTranslation } from 'react-i18next'
import type { ReportSummary } from '@shared/types'
import { ColorDot } from '../components/common/ColorDot'
import { useProjectsStore } from '../stores/projectsStore'
import { startOfWeek } from '../utils/calendar'
import { formatDuration } from '../utils/formatDuration'

type Preset = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom'

interface DateRange {
  from: Dayjs
  to: Dayjs
}

export default function ReportsPage() {
  const { t } = useTranslation()
  const projects = useProjectsStore((s) => s.projects)
  const [preset, setPreset] = useState<Preset>('thisWeek')
  const [customRange, setCustomRange] = useState<[string | null, string | null]>([null, null])
  const [summary, setSummary] = useState<ReportSummary | null>(null)

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])

  const range = useMemo<DateRange | null>(() => {
    const now = dayjs()
    switch (preset) {
      case 'thisWeek': {
        const start = startOfWeek(now)
        return { from: start, to: start.add(7, 'day') }
      }
      case 'lastWeek': {
        const start = startOfWeek(now).subtract(7, 'day')
        return { from: start, to: start.add(7, 'day') }
      }
      case 'thisMonth': {
        const start = now.startOf('month')
        return { from: start, to: start.add(1, 'month') }
      }
      case 'lastMonth': {
        const start = now.startOf('month').subtract(1, 'month')
        return { from: start, to: start.add(1, 'month') }
      }
      case 'custom': {
        const [from, to] = customRange
        if (!from || !to) return null
        return { from: dayjs(from).startOf('day'), to: dayjs(to).add(1, 'day').startOf('day') }
      }
      default:
        return null
    }
  }, [preset, customRange])

  useEffect(() => {
    if (!range) {
      setSummary(null)
      return
    }
    let cancelled = false
    window.api.reports.getSummary(range.from.toISOString(), range.to.toISOString()).then((data) => {
      if (!cancelled) setSummary(data)
    })
    return () => {
      cancelled = true
    }
  }, [range])

  const chartData = useMemo(() => {
    if (!range) return []
    const totalsByDay = new Map((summary?.byDay ?? []).map((d) => [d.date, d.totalSeconds]))
    const days: { date: string; hours: number }[] = []
    let cursor = range.from
    while (cursor.isBefore(range.to)) {
      const key = cursor.format('YYYY-MM-DD')
      const seconds = totalsByDay.get(key) ?? 0
      days.push({ date: cursor.format('DD.MM'), hours: Math.round((seconds / 3600) * 100) / 100 })
      cursor = cursor.add(1, 'day')
    }
    return days
  }, [range, summary])

  const hourChartData = useMemo(() =>
    (summary?.byHour ?? []).map((h) => ({
      label: `${String(h.hour).padStart(2, '0')}:00`,
      hours: Math.round((h.totalSeconds / 3600) * 100) / 100
    })),
    [summary]
  )

  const weekdayChartData = useMemo(() => {
    const dayKeys = ['day0', 'day1', 'day2', 'day3', 'day4', 'day5', 'day6'] as const
    return (summary?.byWeekday ?? []).map((w) => ({
      label: t(`settings.${dayKeys[w.weekday]}`),
      hours: Math.round((w.totalSeconds / 3600) * 100) / 100
    }))
  }, [summary, t])

  const doneByWeekdayData = useMemo(() => {
    const dayKeys = ['day0', 'day1', 'day2', 'day3', 'day4', 'day5', 'day6'] as const
    return (summary?.tasksDoneByWeekday ?? []).map((w) => ({
      label: t(`settings.${dayKeys[w.weekday]}`),
      count: w.count
    }))
  }, [summary, t])

  const hasHourData = (summary?.byHour ?? []).some((h) => h.totalSeconds > 0)
  const hasWeekdayData = (summary?.byWeekday ?? []).some((w) => w.totalSeconds > 0)
  const hasDoneData = (summary?.tasksDoneByWeekday ?? []).some((w) => w.count > 0)

  const totalSeconds = summary?.totalSeconds ?? 0

  return (
    <Stack gap="md">
      <Title order={2}>{t('reports.title')}</Title>

      <Group justify="space-between" wrap="wrap">
        <SegmentedControl
          value={preset}
          onChange={(value) => setPreset(value as Preset)}
          data={[
            { label: t('reports.presetThisWeek'), value: 'thisWeek' },
            { label: t('reports.presetLastWeek'), value: 'lastWeek' },
            { label: t('reports.presetThisMonth'), value: 'thisMonth' },
            { label: t('reports.presetLastMonth'), value: 'lastMonth' },
            { label: t('reports.presetCustom'), value: 'custom' }
          ]}
        />
        {preset === 'custom' && (
          <DatePickerInput
            type="range"
            value={customRange}
            onChange={setCustomRange}
            placeholder={t('reports.selectRange')}
            clearable
            highlightToday
          />
        )}
      </Group>

      <Card withBorder>
        <Text size="sm" c="dimmed">
          {t('reports.totalTime')}
        </Text>
        <Title order={1}>{formatDuration(totalSeconds)}</Title>
      </Card>

      <Card withBorder>
        <Title order={4} mb="sm">
          {t('reports.byDay')}
        </Title>
        <BarChart
          h={260}
          data={chartData}
          dataKey="date"
          series={[{ name: 'hours', color: 'blue.6', label: t('reports.hours') }]}
          withTooltip
          tooltipAnimationDuration={0}
        />
      </Card>

      <Card withBorder>
        <Title order={4} mb="sm">
          {t('reports.byHour')}
        </Title>
        {!hasHourData ? (
          <Text c="dimmed">{t('reports.noData')}</Text>
        ) : (
          <BarChart
            h={200}
            data={hourChartData}
            dataKey="label"
            series={[{ name: 'hours', color: 'teal.6', label: t('reports.hours') }]}
            withTooltip
            tooltipAnimationDuration={0}
          />
        )}
      </Card>

      <Card withBorder>
        <Title order={4} mb="sm">
          {t('reports.byWeekday')}
        </Title>
        {!hasWeekdayData ? (
          <Text c="dimmed">{t('reports.noData')}</Text>
        ) : (
          <BarChart
            h={200}
            data={weekdayChartData}
            dataKey="label"
            series={[{ name: 'hours', color: 'violet.6', label: t('reports.hours') }]}
            withTooltip
            tooltipAnimationDuration={0}
          />
        )}
      </Card>

      <Card withBorder>
        <Title order={4} mb="sm">
          {t('reports.tasksDoneByWeekday')}
        </Title>
        {!hasDoneData ? (
          <Text c="dimmed">{t('reports.noDataDone')}</Text>
        ) : (
          <BarChart
            h={200}
            data={doneByWeekdayData}
            dataKey="label"
            series={[{ name: 'count', color: 'green.6', label: t('reports.tasks') }]}
            withTooltip
            tooltipAnimationDuration={0}
          />
        )}
      </Card>

      <Card withBorder>
        <Title order={4} mb="sm">
          {t('reports.byProject')}
        </Title>
        {(summary?.byProject.length ?? 0) === 0 ? (
          <Text c="dimmed">{t('reports.noData')}</Text>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('tasks.project')}</Table.Th>
                <Table.Th>{t('reports.time')}</Table.Th>
                <Table.Th>{t('reports.share')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {summary?.byProject.map((row) => {
                const project = row.projectId ? projectById.get(row.projectId) : undefined
                const percent = totalSeconds > 0 ? (row.totalSeconds / totalSeconds) * 100 : 0
                return (
                  <Table.Tr key={row.projectId ?? 'none'}>
                    <Table.Td>
                      <Group gap="xs">
                        <ColorDot color={project?.color ?? null} />
                        <Text size="sm">{project?.name ?? t('tasks.noProject')}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>{formatDuration(row.totalSeconds)}</Table.Td>
                    <Table.Td>{percent.toFixed(1)}%</Table.Td>
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      <Card withBorder>
        <Title order={4} mb="sm">
          {t('reports.byTask')}
        </Title>
        {(summary?.byTask.length ?? 0) === 0 ? (
          <Text c="dimmed">{t('reports.noData')}</Text>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('tasks.title')}</Table.Th>
                <Table.Th>{t('tasks.project')}</Table.Th>
                <Table.Th>{t('reports.time')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {summary?.byTask.map((row) => {
                const project = row.projectId ? projectById.get(row.projectId) : undefined
                return (
                  <Table.Tr key={row.taskId}>
                    <Table.Td>{row.title}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ColorDot color={project?.color ?? null} />
                        <Text size="sm">{project?.name ?? t('tasks.noProject')}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>{formatDuration(row.totalSeconds)}</Table.Td>
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  )
}
