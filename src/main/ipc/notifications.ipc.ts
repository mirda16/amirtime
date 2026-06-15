import { ipcMain, Notification } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'

export function registerNotificationsIpc(): void {
  ipcMain.handle(
    IpcChannels.notificationsShow,
    (_event, opts: { title: string; body: string }) => {
      if (Notification.isSupported()) {
        new Notification({ title: opts.title, body: opts.body }).show()
      }
    }
  )
}
