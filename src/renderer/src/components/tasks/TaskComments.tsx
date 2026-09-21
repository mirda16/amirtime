import { useEffect, useRef, useState } from 'react'
import { ActionIcon, Box, Button, Divider, Group, Stack, Text, Textarea, Title, Tooltip } from '@mantine/core'
import { useClickOutside } from '@mantine/hooks'
import { IconCheck, IconEdit, IconMessage, IconSend, IconTrash, IconX } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import type { TaskComment } from '@shared/types'

interface TaskCommentsProps {
  taskId: string
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const { t } = useTranslation()
  const [comments, setComments] = useState<TaskComment[]>([])
  const [newText, setNewText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const confirmRef = useClickOutside(() => setDeleteConfirmId(null))

  useEffect(() => {
    void window.api.comments.getByTask(taskId).then(setComments)
  }, [taskId])

  const handleAdd = async () => {
    const content = newText.trim()
    if (!content) return
    setIsSubmitting(true)
    try {
      const comment = await window.api.comments.create(taskId, { content })
      setComments((prev) => [...prev, comment])
      setNewText('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEdit = (comment: TaskComment) => {
    setEditingId(comment.id)
    setEditText(comment.content)
    setDeleteConfirmId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const handleSaveEdit = async (id: string) => {
    const content = editText.trim()
    if (!content) return
    const updated = await window.api.comments.update(id, { content })
    setComments((prev) => prev.map((c) => (c.id === id ? updated : c)))
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    await window.api.comments.delete(id)
    setComments((prev) => prev.filter((c) => c.id !== id))
    setDeleteConfirmId(null)
  }

  return (
    <Stack gap="xs">
      <Divider />
      <Group gap="xs">
        <IconMessage size={16} />
        <Title order={6}>{t('tasks.comments')}</Title>
      </Group>

      {comments.length === 0 && (
        <Text size="sm" c="dimmed">{t('tasks.commentNoComments')}</Text>
      )}

      {comments.map((comment) => (
        <Box
          key={comment.id}
          style={{
            borderRadius: 8,
            padding: '8px 10px',
            background: 'color-mix(in srgb, var(--mantine-color-default-border) 40%, transparent)'
          }}
        >
          {editingId === comment.id ? (
            <Stack gap="xs">
              <Textarea
                autosize
                minRows={2}
                value={editText}
                onChange={(e) => setEditText(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void handleSaveEdit(comment.id)
                  if (e.key === 'Escape') cancelEdit()
                }}
                autoFocus
              />
              <Group gap="xs" justify="flex-end">
                <ActionIcon variant="subtle" color="gray" onClick={cancelEdit} size="sm">
                  <IconX size={14} />
                </ActionIcon>
                <ActionIcon
                  variant="filled"
                  color="blue"
                  onClick={() => void handleSaveEdit(comment.id)}
                  size="sm"
                  disabled={!editText.trim()}
                >
                  <IconCheck size={14} />
                </ActionIcon>
              </Group>
            </Stack>
          ) : (
            <>
              <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {comment.content}
              </Text>
              <Group justify="space-between" mt={4}>
                <Text size="xs" c="dimmed">
                  {dayjs(comment.createdAt).format('D.M. HH:mm')}
                  {comment.updatedAt !== comment.createdAt && (
                    <> · {t('tasks.commentEdited')}</>
                  )}
                </Text>
                <Group gap={4}>
                  {deleteConfirmId === comment.id ? (
                    <Group gap={4} ref={confirmRef}>
                      <Text size="xs" c="red">{t('tasks.commentDeleteConfirm')}</Text>
                      <ActionIcon
                        color="red"
                        variant="filled"
                        size="xs"
                        onClick={() => void handleDelete(comment.id)}
                      >
                        <IconCheck size={10} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        size="xs"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        <IconX size={10} />
                      </ActionIcon>
                    </Group>
                  ) : (
                    <>
                      <Tooltip label={t('tasks.commentEdit')} withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="xs"
                          onClick={() => startEdit(comment)}
                        >
                          <IconEdit size={12} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={t('tasks.commentDelete')} withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="xs"
                          onClick={() => setDeleteConfirmId(comment.id)}
                        >
                          <IconTrash size={12} />
                        </ActionIcon>
                      </Tooltip>
                    </>
                  )}
                </Group>
              </Group>
            </>
          )}
        </Box>
      ))}

      <Textarea
        ref={textareaRef}
        placeholder={t('tasks.commentPlaceholder')}
        value={newText}
        onChange={(e) => setNewText(e.currentTarget.value)}
        autosize
        minRows={2}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void handleAdd()
        }}
      />
      <Group justify="flex-end">
        <Button
          size="xs"
          leftSection={<IconSend size={14} />}
          onClick={() => void handleAdd()}
          loading={isSubmitting}
          disabled={!newText.trim()}
        >
          {t('tasks.commentAdd')}
        </Button>
      </Group>
    </Stack>
  )
}
