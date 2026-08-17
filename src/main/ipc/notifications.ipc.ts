import { BrowserWindow, ipcMain, Notification } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'

export function registerNotificationsIpc(): void {
  ipcMain.handle(
    IpcChannels.notificationsShow,
    (_event, opts: { title: string; body: string }) => {
      if (!Notification.isSupported()) return

      const notification = new Notification({ title: opts.title, body: opts.body })

      notification.on('click', () => {
        // Bring the app window to the front
        const win = BrowserWindow.getAllWindows()[0]
        if (win) {
          if (win.isMinimized()) win.restore()
          win.focus()
          // Tell the renderer to dismiss the reminder directly — more reliable
          // than relying on the window 'focus' event which can arrive late on Windows.
          win.webContents.send(IpcChannels.notificationClicked)
        }
      })

      notification.show()
    }
  )
}
