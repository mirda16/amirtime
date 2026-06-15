import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import { projectsRepo } from '../db/repositories/projects.repo'
import type { CreateProjectInput, UpdateProjectInput } from '@shared/types'

export function registerProjectsIpc(): void {
  ipcMain.handle(IpcChannels.projectsGetAll, () => projectsRepo.getAll())

  ipcMain.handle(IpcChannels.projectsCreate, (_event, input: CreateProjectInput) =>
    projectsRepo.create(input)
  )

  ipcMain.handle(
    IpcChannels.projectsUpdate,
    (_event, id: string, patch: UpdateProjectInput) => projectsRepo.update(id, patch)
  )

  ipcMain.handle(IpcChannels.projectsDelete, (_event, id: string) => projectsRepo.delete(id))

  ipcMain.handle(IpcChannels.projectsReorder, (_event, orderedIds: string[]) =>
    projectsRepo.reorder(orderedIds)
  )
}
