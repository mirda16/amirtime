import { Stack, Text, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'

export default function ReportsPage() {
  const { t } = useTranslation()

  return (
    <Stack gap="xs">
      <Title order={2}>{t('reports.title')}</Title>
      <Text c="dimmed">{t('reports.info')}</Text>
    </Stack>
  )
}
