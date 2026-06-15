import { useState } from 'react'
import { ActionIcon, Divider, NavLink, TextInput } from '@mantine/core'
import { IconPlus, IconX } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { ColorDot } from '../common/ColorDot'
import { useProjectsStore } from '../../stores/projectsStore'
import { useTagsStore } from '../../stores/tagsStore'
import { useUiFilterStore } from '../../stores/uiFilterStore'

export function ProjectsTagsSidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const projects = useProjectsStore((s) => s.projects)
  const createProject = useProjectsStore((s) => s.createProject)
  const deleteProject = useProjectsStore((s) => s.deleteProject)

  const tags = useTagsStore((s) => s.tags)
  const createTag = useTagsStore((s) => s.createTag)
  const deleteTag = useTagsStore((s) => s.deleteTag)

  const selectedProjectId = useUiFilterStore((s) => s.selectedProjectId)
  const selectedTagId = useUiFilterStore((s) => s.selectedTagId)
  const setSelectedProjectId = useUiFilterStore((s) => s.setSelectedProjectId)
  const setSelectedTagId = useUiFilterStore((s) => s.setSelectedTagId)

  const [newProjectName, setNewProjectName] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [addingProject, setAddingProject] = useState(false)
  const [addingTag, setAddingTag] = useState(false)

  const goToTasks = () => {
    if (location.pathname !== '/tasks') navigate('/tasks')
  }

  const submitNewProject = async () => {
    const name = newProjectName.trim()
    if (name) await createProject({ name })
    setNewProjectName('')
    setAddingProject(false)
  }

  const submitNewTag = async () => {
    const name = newTagName.trim()
    if (name) await createTag({ name })
    setNewTagName('')
    setAddingTag(false)
  }

  return (
    <>
      <Divider my="sm" label={t('nav.projects')} labelPosition="center" />
      <NavLink
        label={t('nav.allTasks')}
        active={selectedProjectId === null && location.pathname === '/tasks'}
        onClick={() => {
          setSelectedProjectId(null)
          goToTasks()
        }}
      />
      {projects.map((project) => (
        <NavLink
          key={project.id}
          label={project.name}
          leftSection={<ColorDot color={project.color} />}
          active={selectedProjectId === project.id && location.pathname === '/tasks'}
          onClick={() => {
            setSelectedProjectId(project.id)
            goToTasks()
          }}
          rightSection={
            <ActionIcon
              size="xs"
              variant="subtle"
              color="gray"
              component="span"
              onClick={(e) => {
                e.stopPropagation()
                if (selectedProjectId === project.id) setSelectedProjectId(null)
                void deleteProject(project.id)
              }}
            >
              <IconX size={12} />
            </ActionIcon>
          }
        />
      ))}
      {addingProject ? (
        <TextInput
          size="xs"
          mx="sm"
          autoFocus
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.currentTarget.value)}
          onBlur={submitNewProject}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitNewProject()
            if (e.key === 'Escape') {
              setNewProjectName('')
              setAddingProject(false)
            }
          }}
          placeholder={t('projects.newProject')}
        />
      ) : (
        <NavLink
          label={t('projects.newProject')}
          leftSection={<IconPlus size={16} />}
          onClick={() => setAddingProject(true)}
        />
      )}

      <Divider my="sm" label={t('nav.tags')} labelPosition="center" />
      {tags.map((tag) => (
        <NavLink
          key={tag.id}
          label={tag.name}
          leftSection={<ColorDot color={tag.color} />}
          active={selectedTagId === tag.id && location.pathname === '/tasks'}
          onClick={() => {
            setSelectedTagId(selectedTagId === tag.id ? null : tag.id)
            goToTasks()
          }}
          rightSection={
            <ActionIcon
              size="xs"
              variant="subtle"
              color="gray"
              component="span"
              onClick={(e) => {
                e.stopPropagation()
                if (selectedTagId === tag.id) setSelectedTagId(null)
                void deleteTag(tag.id)
              }}
            >
              <IconX size={12} />
            </ActionIcon>
          }
        />
      ))}
      {addingTag ? (
        <TextInput
          size="xs"
          mx="sm"
          autoFocus
          value={newTagName}
          onChange={(e) => setNewTagName(e.currentTarget.value)}
          onBlur={submitNewTag}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitNewTag()
            if (e.key === 'Escape') {
              setNewTagName('')
              setAddingTag(false)
            }
          }}
          placeholder={t('tags.newTag')}
        />
      ) : (
        <NavLink
          label={t('tags.newTag')}
          leftSection={<IconPlus size={16} />}
          onClick={() => setAddingTag(true)}
        />
      )}
    </>
  )
}
