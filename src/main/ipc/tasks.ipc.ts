import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import { tasksRepo } from '../db/repositories/tasks.repo'
import { syncService } from '../sync/syncService'
import type { CreateTaskInput, TaskFilter, UpdateTaskInput } from '@shared/types'

export function registerTasksIpc(): void {
  ipcMain.handle(IpcChannels.tasksGetAll, (_event, filter?: TaskFilter) =>
    tasksRepo.getAll(filter)
  )

  ipcMain.handle(IpcChannels.tasksGetById, (_event, id: string) => tasksRepo.getById(id))

  ipcMain.handle(IpcChannels.tasksCreate, (_event, input: CreateTaskInput) => {
    const task = tasksRepo.create(input)
    syncService.scheduleExport()
    return task
  })

  ipcMain.handle(IpcChannels.tasksUpdate, (_event, id: string, patch: UpdateTaskInput) => {
    const task = tasksRepo.update(id, patch)
    syncService.scheduleExport()
    return task
  })

  ipcMain.handle(IpcChannels.tasksDelete, (_event, id: string) => {
    tasksRepo.delete(id)
    syncService.scheduleExport()
  })

  ipcMain.handle(IpcChannels.tasksSetTags, (_event, taskId: string, tagIds: string[]) => {
    const task = tasksRepo.setTags(taskId, tagIds)
    syncService.scheduleExport()
    return task
  })

  ipcMain.handle(IpcChannels.tasksReorder, (_event, orderedIds: string[]) => {
    tasksRepo.reorder(orderedIds)
    syncService.scheduleExport()
  })
}
