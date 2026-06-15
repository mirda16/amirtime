interface ColorDotProps {
  color: string | null
}

export function ColorDot({ color }: ColorDotProps) {
  return (
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: color ?? 'var(--mantine-color-gray-5)',
        flexShrink: 0
      }}
    />
  )
}
