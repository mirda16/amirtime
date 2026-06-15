import { registerDataIoIpc } from './dataIo.ipc'
import { registerNotificationsIpc } from './notifications.ipc'
import { registerProjectsIpc } from './projects.ipc'
import { registerReportsIpc } from './reports.ipc'
import { registerSettingsIpc } from './settings.ipc'
import { registerTagsIpc } from './tags.ipc'
import { registerTasksIpc } from './tasks.ipc'
import { registerTimeEntriesIpc } from './timeEntries.ipc'

export function registerIpcHandlers(): void {
  registerProjectsIpc()
  registerTagsIpc()
  registerTasksIpc()
  registerTimeEntriesIpc()
  registerReportsIpc()
  registerSettingsIpc()
  registerNotificationsIpc()
  registerDataIoIpc()
}
