import { ActionIcon, AppShell, Badge, Burger, Group, NavLink, ScrollArea, Text, Title } from '@mantine/core'
import { useDisclosure, useHotkeys } from '@mantine/hooks'
import {
  IconCalendarWeek,
  IconChecklist,
  IconClockHour4,
  IconLayoutKanban,
  IconPlayerStop,
  IconReportAnalytics,
  IconSettings,
  IconSun
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { usePomodoroStore } from '../../stores/pomodoroStore'
import { useTasksStore } from '../../stores/tasksStore'
import { useTimerStore } from '../../stores/timerStore'
import { formatDuration } from '../../utils/formatDuration'
import { ProjectsTagsSidebar } from './ProjectsTagsSidebar'

const NAV_ITEMS = [
  { path: '/tasks', labelKey: 'nav.tasks', Icon: IconChecklist },
  { path: '/today', labelKey: 'nav.today', Icon: IconSun },
  { path: '/kanban', labelKey: 'nav.kanban', Icon: IconLayoutKanban },
  { path: '/calendar', labelKey: 'nav.calendar', Icon: IconCalendarWeek },
  { path: '/pomodoro', labelKey: 'nav.pomodoro', Icon: IconClockHour4 },
  { path: '/reports', labelKey: 'nav.reports', Icon: IconReportAnalytics },
  { path: '/settings', labelKey: 'nav.settings', Icon: IconSettings }
] as const

export function AppShellLayout() {
  const [opened, { toggle }] = useDisclosure()
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const activeEntry = useTimerStore((s) => s.activeEntry)
  const elapsedSeconds = useTimerStore((s) => s.elapsedSeconds)
  const stopTimer = useTimerStore((s) => s.stop)
  const trackedTask = useTasksStore((s) =>
    activeEntry ? s.tasks.find((task) => task.id === activeEntry.taskId) : undefined
  )
  const pomodoroIsRunning = usePomodoroStore((s) => s.isRunning)
  const pomodoroStart = usePomodoroStore((s) => s.start)
  const pomodoroPause = usePomodoroStore((s) => s.pause)

  useHotkeys([
    ['p', () => void navigate('/pomodoro')],
    ['space', () => (pomodoroIsRunning ? pomodoroPause() : pomodoroStart())]
  ])

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={3}>AmirTime</Title>
          </Group>
          {activeEntry && trackedTask && (
            <Group gap="xs">
              <Badge color="red" variant="filled">
                {t('tasks.tracking')}
              </Badge>
              <Text size="sm" truncate maw={200}>
                {trackedTask.title}
              </Text>
              <Text size="sm" fw={700} ff="monospace">
                {formatDuration(elapsedSeconds)}
                {trackedTask.timeSpentSeconds > 0 && (
                  <Text span size="sm" fw={400} c="dimmed" ff="monospace">
                    {' '}({formatDuration(trackedTask.timeSpentSeconds + elapsedSeconds)})
                  </Text>
                )}
              </Text>
              <ActionIcon variant="subtle" color="red" onClick={() => void stopTimer()}>
                <IconPlayerStop size={16} />
              </ActionIcon>
            </Group>
          )}
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea}>
          {NAV_ITEMS.map(({ path, labelKey, Icon }) => (
            <NavLink
              key={path}
              label={t(labelKey)}
              leftSection={<Icon size={18} />}
              active={location.pathname === path}
              onClick={() => navigate(path)}
            />
          ))}
          <ProjectsTagsSidebar />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
