import { NumberInput, Select, SegmentedControl, Stack, Text, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import type { AppSettings } from '@shared/types'
import { useSettingsStore } from '../stores/settingsStore'

export default function SettingsPage() {
  const { t } = useTranslation()
  const settings = useSettingsStore((s) => s.settings)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const setPomodoroSettings = useSettingsStore((s) => s.setPomodoroSettings)

  return (
    <Stack gap="lg" maw={420}>
      <Title order={2}>{t('settings.title')}</Title>

      <Select
        label={t('settings.language')}
        value={settings.language}
        onChange={(value) => value && setLanguage(value)}
        data={[
          { value: 'en', label: 'English' },
          { value: 'cs', label: 'Čeština' }
        ]}
        allowDeselect={false}
      />

      <div>
        <Text size="sm" fw={500} mb={4}>
          {t('settings.theme')}
        </Text>
        <SegmentedControl
          fullWidth
          value={settings.theme}
          onChange={(value) => setTheme(value as AppSettings['theme'])}
          data={[
            { value: 'light', label: t('settings.light') },
            { value: 'dark', label: t('settings.dark') },
            { value: 'auto', label: t('settings.auto') }
          ]}
        />
      </div>

      <Title order={4}>{t('settings.pomodoroSettings')}</Title>
      <NumberInput
        label={t('pomodoro.workMinutes')}
        min={1}
        value={settings.pomodoro.workMinutes}
        onChange={(value) =>
          setPomodoroSettings({ ...settings.pomodoro, workMinutes: Number(value) || 1 })
        }
      />
      <NumberInput
        label={t('pomodoro.shortBreakMinutes')}
        min={1}
        value={settings.pomodoro.shortBreakMinutes}
        onChange={(value) =>
          setPomodoroSettings({ ...settings.pomodoro, shortBreakMinutes: Number(value) || 1 })
        }
      />
      <NumberInput
        label={t('pomodoro.longBreakMinutes')}
        min={1}
        value={settings.pomodoro.longBreakMinutes}
        onChange={(value) =>
          setPomodoroSettings({ ...settings.pomodoro, longBreakMinutes: Number(value) || 1 })
        }
      />
      <NumberInput
        label={t('pomodoro.cyclesBeforeLongBreak')}
        min={1}
        value={settings.pomodoro.cyclesBeforeLongBreak}
        onChange={(value) =>
          setPomodoroSettings({ ...settings.pomodoro, cyclesBeforeLongBreak: Number(value) || 1 })
        }
      />
    </Stack>
  )
}
