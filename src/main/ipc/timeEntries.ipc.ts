import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import { tasksRepo } from '../db/repositories/tasks.repo'
import { timeEntriesRepo } from '../db/repositories/timeEntries.repo'
import { syncService } from '../sync/syncService'

export function registerTimeEntriesIpc(): void {
  ipcMain.handle(IpcChannels.timeEntriesGetActive, () => timeEntriesRepo.getActive())

  ipcMain.handle(IpcChannels.timeEntriesStart, (_event, taskId: string) =>
    timeEntriesRepo.start(taskId)
  )

  ipcMain.handle(IpcChannels.timeEntriesStop, (_event, entryId: string) => {
    const entry = timeEntriesRepo.stop(entryId)
    const task = tasksRepo.getById(entry.taskId)
    syncService.scheduleExport()
    return { entry, task }
  })
}
