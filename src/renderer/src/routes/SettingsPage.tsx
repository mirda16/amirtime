import { useEffect, useState } from 'react'
import { Button, Code, Group, Modal, NumberInput, Select, SegmentedControl, Stack, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useTranslation } from 'react-i18next'
import type { AppSettings } from '@shared/types'
import { useProjectsStore } from '../stores/projectsStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useTagsStore } from '../stores/tagsStore'
import { useTasksStore } from '../stores/tasksStore'
import { useTimerStore } from '../stores/timerStore'

export default function SettingsPage() {
  const { t } = useTranslation()
  const settings = useSettingsStore((s) => s.settings)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const setPomodoroSettings = useSettingsStore((s) => s.setPomodoroSettings)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const loadProjects = useProjectsStore((s) => s.loadProjects)
  const loadTags = useTagsStore((s) => s.loadTags)
  const loadTasks = useTasksStore((s) => s.loadTasks)
  const initTimer = useTimerStore((s) => s.init)
  const resetTimer = useTimerStore((s) => s.reset)

  const [importModalOpen, setImportModalOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [syncPath, setSyncPath] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    void window.api.sync.getPath().then(setSyncPath)
  }, [])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await window.api.dataIO.exportAll()
      if (!result.canceled) {
        notifications.show({ message: t('settings.exportSuccess'), color: 'green' })
      }
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async () => {
    setImportModalOpen(false)
    setIsImporting(true)
    try {
      const result = await window.api.dataIO.importAll()
      if (result.canceled) return

      if (result.success) {
        resetTimer()
        await Promise.all([loadSettings(), loadProjects(), loadTags(), loadTasks()])
        await initTimer()
        notifications.show({ message: t('settings.importSuccess'), color: 'green' })
      } else {
        notifications.show({ message: t('settings.importError'), color: 'red' })
      }
    } finally {
      setIsImporting(false)
    }
  }

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

      <Title order={4}>{t('settings.timerSection')}</Title>
      <Select
        label={t('settings.timerReminder')}
        description={t('settings.timerReminderDesc')}
        value={String(settings.timerReminderHours)}
        onChange={(v) => {
          const hours = Number(v ?? '0')
          void window.api.settings.set('timerReminderHours', hours)
        }}
        data={[
          { value: '0', label: t('settings.timerReminderOff') },
          { value: '1', label: '1 ' + t('settings.hours') },
          { value: '2', label: '2 ' + t('settings.hours') },
          { value: '4', label: '4 ' + t('settings.hours') },
          { value: '8', label: '8 ' + t('settings.hours') }
        ]}
        allowDeselect={false}
      />

      <Title order={4}>{t('settings.dataSection')}</Title>
      <Text size="sm" c="dimmed">
        {t('settings.dataDescription')}
      </Text>
      <Group>
        <Button onClick={handleExport} loading={isExporting}>
          {t('settings.exportData')}
        </Button>
        <Button color="red" variant="light" onClick={() => setImportModalOpen(true)} loading={isImporting}>
          {t('settings.importData')}
        </Button>
      </Group>

      <Title order={4}>{t('settings.syncSection')}</Title>
      <Text size="sm" c="dimmed">{t('settings.syncDescription')}</Text>
      {syncPath ? (
        <Stack gap="xs">
          <Code block style={{ wordBreak: 'break-all' }}>{syncPath}</Code>
          <Group>
            <Button
              variant="light"
              loading={isSyncing}
              onClick={async () => {
                setIsSyncing(true)
                await window.api.sync.exportNow()
                setIsSyncing(false)
                notifications.show({ message: t('settings.syncExportDone'), color: 'green' })
              }}
            >
              {t('settings.syncNow')}
            </Button>
            <Button
              variant="subtle"
              color="red"
              onClick={async () => {
                await window.api.sync.clearPath()
                setSyncPath(null)
              }}
            >
              {t('settings.syncDisable')}
            </Button>
          </Group>
        </Stack>
      ) : (
        <Button
          variant="light"
          onClick={async () => {
            const path = await window.api.sync.selectPath()
            if (path) {
              setSyncPath(path)
              notifications.show({ message: t('settings.syncEnabled'), color: 'green' })
            }
          }}
        >
          {t('settings.syncEnable')}
        </Button>
      )}

      <Modal
        opened={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title={t('settings.importData')}
      >
        <Stack gap="md">
          <Text size="sm">{t('settings.importWarning')}</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setImportModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button color="red" onClick={handleImport}>
              {t('common.confirm')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
