export const IpcChannels = {
  projectsGetAll: 'projects:getAll',
  projectsCreate: 'projects:create',
  projectsUpdate: 'projects:update',
  projectsDelete: 'projects:delete',
  projectsReorder: 'projects:reorder',

  tagsGetAll: 'tags:getAll',
  tagsCreate: 'tags:create',
  tagsUpdate: 'tags:update',
  tagsDelete: 'tags:delete',

  tasksGetAll: 'tasks:getAll',
  tasksGetById: 'tasks:getById',
  tasksCreate: 'tasks:create',
  tasksUpdate: 'tasks:update',
  tasksDelete: 'tasks:delete',
  tasksSetTags: 'tasks:setTags',
  tasksReorder: 'tasks:reorder',

  timeEntriesGetActive: 'timeEntries:getActive',
  timeEntriesStart: 'timeEntries:start',
  timeEntriesStop: 'timeEntries:stop',

  reportsGetSummary: 'reports:getSummary',

  dataIoExportAll: 'dataIO:exportAll',
  dataIoImportAll: 'dataIO:importAll',

  subtasksCreate: 'subtasks:create',
  subtasksUpdate: 'subtasks:update',
  subtasksDelete: 'subtasks:delete',

  settingsGetAll: 'settings:getAll',
  settingsSet: 'settings:set',

  notificationsShow: 'notifications:show',

  syncGetPath: 'sync:getPath',
  syncSelectPath: 'sync:selectPath',
  syncConnectPath: 'sync:connectPath',
  syncClearPath: 'sync:clearPath',
  syncExportNow: 'sync:exportNow',
  syncImportNow: 'sync:importNow',
  syncDataChanged: 'sync:dataChanged'
} as const
