import { useMemo } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Progress,
  Stack,
  Text,
  Title
} from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { ColorDot } from '../components/common/ColorDot'
import { usePomodoroStore } from '../stores/pomodoroStore'
import { useProjectsStore } from '../stores/projectsStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useTasksStore } from '../stores/tasksStore'

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export default function PomodoroPage() {
  const { t } = useTranslation()
  const { phase, remainingSeconds, isRunning, cyclesCompleted, linkedTaskId, start, pause, reset, linkTask } =
    usePomodoroStore()
  const pomodoroSettings = useSettingsStore((s) => s.settings.pomodoro)
  const tasks = useTasksStore((s) => s.tasks)
  const projects = useProjectsStore((s) => s.projects)

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])

  const linkedTask = linkedTaskId ? tasks.find((t) => t.id === linkedTaskId) : undefined
  const linkedProject = linkedTask?.projectId ? projectById.get(linkedTask.projectId) : undefined

  const todayTasks = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD')
    return tasks.filter(
      (task) =>
        !task.isDone &&
        (task.scheduledAt?.startsWith(today) || task.dueDate === today)
    )
  }, [tasks])

  const phaseDuration =
    phase === 'work'
      ? pomodoroSettings.workMinutes * 60
      : phase === 'shortBreak'
        ? pomodoroSettings.shortBreakMinutes * 60
        : pomodoroSettings.longBreakMinutes * 60

  const progress = ((phaseDuration - remainingSeconds) / phaseDuration) * 100

  const phaseLabel =
    phase === 'work'
      ? t('pomodoro.work')
      : phase === 'shortBreak'
        ? t('pomodoro.shortBreak')
        : t('pomodoro.longBreak')

  const phaseColor = phase === 'work' ? 'red' : phase === 'shortBreak' ? 'teal' : 'blue'

  return (
    <Stack gap="lg">
      <Stack align="center" gap="lg" mt="xl">
        <Badge size="lg" color={phaseColor} variant="light">
          {phaseLabel}
        </Badge>
        <Title order={1} style={{ fontSize: '5rem', fontFamily: 'monospace' }}>
          {formatTime(remainingSeconds)}
        </Title>
        <Progress value={progress} color={phaseColor} w={300} size="lg" radius="xl" />

        {linkedTask ? (
          <Card withBorder w={300} py="xs" px="md">
            <Group justify="space-between" wrap="nowrap">
              <Stack gap={2} style={{ minWidth: 0 }}>
                <Text size="xs" c="dimmed">
                  {t('pomodoro.currentTask')}
                </Text>
                <Text size="sm" fw={500} truncate>
                  {linkedTask.title}
                </Text>
                {linkedProject && (
                  <Group gap={4}>
                    <ColorDot color={linkedProject.color} />
                    <Text size="xs" c="dimmed">
                      {linkedProject.name}
                    </Text>
                  </Group>
                )}
              </Stack>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={() => linkTask(null)}
                aria-label={t('common.close')}
              >
                <IconX size={14} />
              </ActionIcon>
            </Group>
          </Card>
        ) : (
          <Text size="sm" c="dimmed">
            {t('pomodoro.noLinkedTask')}
          </Text>
        )}

        <Group>
          {isRunning ? (
            <Button onClick={pause} size="lg">
              {t('pomodoro.pause')}
            </Button>
          ) : (
            <Button onClick={start} size="lg">
              {t('pomodoro.start')}
            </Button>
          )}
          <Button onClick={reset} variant="default" size="lg">
            {t('pomodoro.reset')}
          </Button>
        </Group>
        <Text c="dimmed">{t('pomodoro.cyclesCompleted', { count: cyclesCompleted })}</Text>
      </Stack>

      {todayTasks.length > 0 && (
        <>
          <Divider />
          <Stack gap="xs">
            <Text fw={500} size="sm">
              {t('pomodoro.todayTasks')}
            </Text>
            {todayTasks.map((task) => {
              const project = task.projectId ? projectById.get(task.projectId) : undefined
              const isLinked = task.id === linkedTaskId
              return (
                <Card
                  key={task.id}
                  withBorder
                  py="xs"
                  px="md"
                  style={{
                    cursor: 'pointer',
                    borderColor: isLinked ? 'var(--mantine-color-red-5)' : undefined
                  }}
                  onClick={() => linkTask(isLinked ? null : task.id)}
                >
                  <Group gap="sm" wrap="nowrap">
                    <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" fw={500} truncate>
                        {task.title}
                      </Text>
                      {project && (
                        <Group gap={4}>
                          <ColorDot color={project.color} />
                          <Text size="xs" c="dimmed">
                            {project.name}
                          </Text>
                        </Group>
                      )}
                    </Stack>
                    {isLinked && (
                      <Badge size="xs" color="red" variant="light">
                        {t('pomodoro.active')}
                      </Badge>
                    )}
                  </Group>
                </Card>
              )
            })}
          </Stack>
        </>
      )}
    </Stack>
  )
}
