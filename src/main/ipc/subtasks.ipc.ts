import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type { CreateSubtaskInput, UpdateSubtaskInput } from '@shared/types'
import { subtasksRepo } from '../db/repositories/subtasks.repo'
import { tasksRepo } from '../db/repositories/tasks.repo'

export function registerSubtasksIpc(): void {
  ipcMain.handle(
    IpcChannels.subtasksCreate,
    (_event, taskId: string, input: CreateSubtaskInput) => {
      subtasksRepo.create(taskId, input)
      return tasksRepo.getById(taskId)
    }
  )

  ipcMain.handle(
    IpcChannels.subtasksUpdate,
    (_event, subtaskId: string, taskId: string, patch: UpdateSubtaskInput) => {
      subtasksRepo.update(subtaskId, patch)
      return tasksRepo.getById(taskId)
    }
  )

  ipcMain.handle(IpcChannels.subtasksDelete, (_event, subtaskId: string, taskId: string) => {
    subtasksRepo.delete(subtaskId)
    return tasksRepo.getById(taskId)
  })
}
