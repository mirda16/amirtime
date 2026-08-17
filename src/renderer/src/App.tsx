import { useEffect } from 'react'
import { MantineProvider, useMantineColorScheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShellLayout } from './components/layout/AppShellLayout'
import CalendarPage from './routes/CalendarPage'
import PomodoroPage from './routes/PomodoroPage'
import ReportsPage from './routes/ReportsPage'
import SettingsPage from './routes/SettingsPage'
import TasksPage from './routes/TasksPage'
import KanbanPage from './routes/KanbanPage'
import TodayPage from './routes/TodayPage'
import ArchivePage from './routes/ArchivePage'
import TablePage from './routes/TablePage'
import { useProjectsStore } from './stores/projectsStore'
import { useSettingsStore } from './stores/settingsStore'
import { useTagsStore } from './stores/tagsStore'
import { useTasksStore } from './stores/tasksStore'
import { useTimerStore } from './stores/timerStore'

function ColorSchemeSync() {
  const theme = useSettingsStore((s) => s.settings.theme)
  const { setColorScheme } = useMantineColorScheme()

  useEffect(() => {
    setColorScheme(theme)
  }, [theme, setColorScheme])

  return null
}

function AppData() {
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const loadProjects = useProjectsStore((s) => s.loadProjects)
  const loadTags = useTagsStore((s) => s.loadTags)
  const loadTasks = useTasksStore((s) => s.loadTasks)
  const initTimer = useTimerStore((s) => s.init)

  useEffect(() => {
    void loadSettings()
    void loadProjects()
    void loadTags()
    void loadTasks()
    void initTimer()
  }, [loadSettings, loadProjects, loadTags, loadTasks, initTimer])

  useEffect(() => {
    return window.api.sync.onDataChanged(() => {
      void loadProjects()
      void loadTags()
      void loadTasks()
    })
  }, [loadProjects, loadTags, loadTasks])

  useEffect(() => {
    // Primary path: notification click sends a direct IPC event — reliable on all platforms.
    const unsubscribe = window.api.notifications.onClicked(() => {
      const { reminderSentAt, dismissReminder } = useTimerStore.getState()
      if (reminderSentAt) dismissReminder()
    })
    // Fallback: also dismiss when the window gains focus (covers the case where
    // the user switches to the app without clicking the notification itself).
    const handleFocus = () => {
      const { reminderSentAt, dismissReminder } = useTimerStore.getState()
      if (reminderSentAt) dismissReminder()
    }
    window.addEventListener('focus', handleFocus)
    return () => {
      unsubscribe()
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  return null
}

function App() {
  return (
    <MantineProvider defaultColorScheme="auto">
      <Notifications />
      <ColorSchemeSync />
      <AppData />
      <HashRouter>
        <Routes>
          <Route element={<AppShellLayout />}>
            <Route index element={<Navigate to="/tasks" replace />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/today" element={<TodayPage />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/pomodoro" element={<PomodoroPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/table" element={<TablePage />} />
          </Route>
        </Routes>
      </HashRouter>
    </MantineProvider>
  )
}

export default App
