import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import { tagsRepo } from '../db/repositories/tags.repo'
import type { CreateTagInput, UpdateTagInput } from '@shared/types'

export function registerTagsIpc(): void {
  ipcMain.handle(IpcChannels.tagsGetAll, () => tagsRepo.getAll())

  ipcMain.handle(IpcChannels.tagsCreate, (_event, input: CreateTagInput) =>
    tagsRepo.create(input)
  )

  ipcMain.handle(IpcChannels.tagsUpdate, (_event, id: string, patch: UpdateTagInput) =>
    tagsRepo.update(id, patch)
  )

  ipcMain.handle(IpcChannels.tagsDelete, (_event, id: string) => tagsRepo.delete(id))
}
