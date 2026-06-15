import { Badge, Button, Group, Progress, Stack, Text, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { usePomodoroStore } from '../stores/pomodoroStore'
import { useSettingsStore } from '../stores/settingsStore'

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export default function PomodoroPage() {
  const { t } = useTranslation()
  const { phase, remainingSeconds, isRunning, cyclesCompleted, start, pause, reset } =
    usePomodoroStore()
  const pomodoroSettings = useSettingsStore((s) => s.settings.pomodoro)

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
    <Stack align="center" gap="lg" mt="xl">
      <Badge size="lg" color={phaseColor} variant="light">
        {phaseLabel}
      </Badge>
      <Title order={1} style={{ fontSize: '5rem', fontFamily: 'monospace' }}>
        {formatTime(remainingSeconds)}
      </Title>
      <Progress value={progress} color={phaseColor} w={300} size="lg" radius="xl" />
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
  )
}
