import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import { tasksRepo } from '../db/repositories/tasks.repo'
import type { CreateTaskInput, TaskFilter, UpdateTaskInput } from '@shared/types'

export function registerTasksIpc(): void {
  ipcMain.handle(IpcChannels.tasksGetAll, (_event, filter?: TaskFilter) =>
    tasksRepo.getAll(filter)
  )

  ipcMain.handle(IpcChannels.tasksGetById, (_event, id: string) => tasksRepo.getById(id))

  ipcMain.handle(IpcChannels.tasksCreate, (_event, input: CreateTaskInput) =>
    tasksRepo.create(input)
  )

  ipcMain.handle(IpcChannels.tasksUpdate, (_event, id: string, patch: UpdateTaskInput) =>
    tasksRepo.update(id, patch)
  )

  ipcMain.handle(IpcChannels.tasksDelete, (_event, id: string) => tasksRepo.delete(id))

  ipcMain.handle(IpcChannels.tasksSetTags, (_event, taskId: string, tagIds: string[]) =>
    tasksRepo.setTags(taskId, tagIds)
  )

  ipcMain.handle(IpcChannels.tasksReorder, (_event, orderedIds: string[]) =>
    tasksRepo.reorder(orderedIds)
  )
}
