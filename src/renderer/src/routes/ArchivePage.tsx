import { useEffect, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  Title
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconArchiveOff, IconTrash } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import type { Task } from '@shared/types'
import { useProjectsStore } from '../stores/projectsStore'
import { ColorDot } from '../components/common/ColorDot'

export default function ArchivePage() {
  const { t } = useTranslation()
  const projects = useProjectsStore((s) => s.projects)
  const projectById = new Map(projects.map((p) => [p.id, p]))

  const [archivedTasks, setArchivedTasks] = useState<Task[]>([])
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)

  const load = async () => {
    const tasks = await window.api.tasks.getAll({ archived: true })
    // Sort newest archived first
    setArchivedTasks(
      [...tasks].sort((a, b) => (b.archivedAt ?? '').localeCompare(a.archivedAt ?? ''))
    )
  }

  useEffect(() => {
    void load()
  }, [])

  const handleRestore = async (task: Task) => {
    await window.api.tasks.unarchive(task.id)
    setArchivedTasks((prev) => prev.filter((t) => t.id !== task.id))
    notifications.show({ message: t('archive.restoreSuccess'), color: 'green' })
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await window.api.tasks.delete(deleteTarget.id)
    setArchivedTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id))
    setDeleteTarget(null)
    notifications.show({ message: t('archive.deleteSuccess'), color: 'red' })
  }

  return (
    <Stack>
      <Title order={2}>{t('archive.title')}</Title>

      {archivedTasks.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          {t('archive.noTasks')}
        </Text>
      ) : (
        <Stack gap={0}>
          {archivedTasks.map((task) => {
            const project = task.projectId ? projectById.get(task.projectId) : undefined
            return (
              <Group
                key={task.id}
                wrap="nowrap"
                gap="sm"
                py="xs"
                px="sm"
                style={{
                  borderBottom: '1px solid var(--mantine-color-default-border)',
                  borderLeft: task.color ? `4px solid ${task.color}` : undefined
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={500} td={task.isDone ? 'line-through' : undefined} truncate>
                    {task.title}
                  </Text>
                  <Group gap="xs" mt={2}>
                    {project && (
                      <Badge size="xs" variant="light" leftSection={<ColorDot color={project.color} />}>
                        {project.name}
                      </Badge>
                    )}
                    {task.isDone && (
                      <Badge size="xs" color="green" variant="light">
                        {t('tasks.markDone')}
                      </Badge>
                    )}
                    <Text size="xs" c="dimmed">
                      {t('archive.archivedAt')}: {dayjs(task.archivedAt).format('DD.MM.YYYY')}
                    </Text>
                  </Group>
                </div>
                <ActionIcon
                  variant="subtle"
                  color="blue"
                  onClick={() => void handleRestore(task)}
                  aria-label={t('tasks.unarchive')}
                  title={t('tasks.unarchive')}
                >
                  <IconArchiveOff size={16} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={() => setDeleteTarget(task)}
                  aria-label={t('tasks.deleteForever')}
                  title={t('tasks.deleteForever')}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            )
          })}
        </Stack>
      )}

      <Modal
        opened={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={t('tasks.deleteForever')}
      >
        <Stack gap="md">
          <Text size="sm">{t('tasks.deleteForeverConfirm')}</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button color="red" onClick={() => void handleDelete()}>
              {t('common.delete')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
