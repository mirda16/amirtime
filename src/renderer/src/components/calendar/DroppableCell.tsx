import { useDroppable } from '@dnd-kit/core'

interface DroppableCellProps {
  id: string
  height: number
}

export function DroppableCell({ id, height }: DroppableCellProps) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        height,
        borderBottom: '1px solid var(--mantine-color-default-border)'
      }}
    />
  )
}
