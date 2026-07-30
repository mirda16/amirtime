import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import { projectsRepo } from '../db/repositories/projects.repo'
import { syncService } from '../sync/syncService'
import type { CreateProjectInput, UpdateProjectInput } from '@shared/types'

export function registerProjectsIpc(): void {
  ipcMain.handle(IpcChannels.projectsGetAll, () => projectsRepo.getAll())

  ipcMain.handle(IpcChannels.projectsCreate, (_event, input: CreateProjectInput) => {
    const project = projectsRepo.create(input)
    syncService.scheduleExport()
    return project
  })

  ipcMain.handle(IpcChannels.projectsUpdate, (_event, id: string, patch: UpdateProjectInput) => {
    const project = projectsRepo.update(id, patch)
    syncService.scheduleExport()
    return project
  })

  ipcMain.handle(IpcChannels.projectsDelete, (_event, id: string) => {
    projectsRepo.delete(id)
    syncService.scheduleExport()
  })

  ipcMain.handle(IpcChannels.projectsReorder, (_event, orderedIds: string[]) => {
    projectsRepo.reorder(orderedIds)
    syncService.scheduleExport()
  })
}
