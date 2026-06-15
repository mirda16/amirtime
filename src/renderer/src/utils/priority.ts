import type { TaskPriority } from '@shared/types'

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  none: 'gray',
  low: 'blue',
  medium: 'orange',
  high: 'red'
}

export const PRIORITY_ORDER: TaskPriority[] = ['high', 'medium', 'low', 'none']
