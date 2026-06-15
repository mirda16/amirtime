import { ColorPicker, Popover, UnstyledButton } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { ColorDot } from './ColorDot'

export const SWATCHES = [
  '#e03131',
  '#f08c00',
  '#f5c211',
  '#74b816',
  '#2f9e44',
  '#0c8599',
  '#1971c2',
  '#5f3dc4',
  '#9c36b5',
  '#e64980',
  '#495057'
]

interface ColorPickerPopoverProps {
  color: string | null
  onChange: (color: string | null) => void
}

export function ColorPickerPopover({ color, onChange }: ColorPickerPopoverProps) {
  const { t } = useTranslation()
  return (
    <Popover position="bottom-start" withArrow shadow="md">
      <Popover.Target>
        <UnstyledButton
          aria-label="Color"
          style={{ display: 'flex', alignItems: 'center', padding: 4 }}
        >
          <ColorDot color={color} />
        </UnstyledButton>
      </Popover.Target>
      <Popover.Dropdown>
        <ColorPicker
          format="hex"
          value={color ?? undefined}
          onChange={onChange}
          swatches={SWATCHES}
          swatchesPerRow={SWATCHES.length}
          withPicker={false}
        />
        <UnstyledButton
          mt="xs"
          fz="xs"
          c="dimmed"
          onClick={() => onChange(null)}
          style={{ display: 'block' }}
        >
          {t('common.clearColor')}
        </UnstyledButton>
      </Popover.Dropdown>
    </Popover>
  )
}
