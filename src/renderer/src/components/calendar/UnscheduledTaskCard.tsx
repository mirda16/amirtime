import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Badge, Card, Group, Text } from '@mantine/core'
import type { Project, Task } from '@shared/types'
import { taskDraggableId } from '../../utils/calendar'
import { ColorDot } from '../common/ColorDot'

interface UnscheduledTaskCardProps {
  task: Task
  project: Project | undefined
  onOpen: () => void
}

export function UnscheduledTaskCard({ task, project, onOpen }: UnscheduledTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: taskDraggableId(task.id)
  })

  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      withBorder
      padding="xs"
      style={{
        cursor: 'grab',
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 100 : undefined,
        borderLeft: task.color ? `4px solid ${task.color}` : undefined
      }}
    >
      <Text size="sm" fw={500} truncate>
        {task.title}
      </Text>
      {project && (
        <Group gap={4} mt={4}>
          <Badge size="xs" variant="light" leftSection={<ColorDot color={project.color} />}>
            {project.name}
          </Badge>
        </Group>
      )}
    </Card>
  )
}
