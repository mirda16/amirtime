import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type { CreateCommentInput, UpdateCommentInput } from '@shared/types'
import { commentsRepo } from '../db/repositories/comments.repo'
import { syncService } from '../sync/syncService'

export function registerCommentsIpc(): void {
  ipcMain.handle(IpcChannels.commentsGetByTask, (_event, taskId: string) => {
    return commentsRepo.getByTaskId(taskId)
  })

  ipcMain.handle(IpcChannels.commentsCreate, (_event, taskId: string, input: CreateCommentInput) => {
    const comment = commentsRepo.create(taskId, input)
    syncService.scheduleExport()
    return comment
  })

  ipcMain.handle(IpcChannels.commentsUpdate, (_event, id: string, patch: UpdateCommentInput) => {
    const comment = commentsRepo.update(id, patch)
    syncService.scheduleExport()
    return comment
  })

  ipcMain.handle(IpcChannels.commentsDelete, (_event, id: string) => {
    commentsRepo.delete(id)
    syncService.scheduleExport()
  })
}
