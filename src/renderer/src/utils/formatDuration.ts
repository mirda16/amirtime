export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

export function secondsToHHMM(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function hhmmToSeconds(value: string): number | null {
  const match = value.match(/^(\d+):([0-5]\d)$/)
  if (!match) return null
  return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60
}

export function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function hhmmToMinutes(value: string): number | null {
  const match = value.match(/^(\d+):([0-5]\d)$/)
  if (!match) return null
  return parseInt(match[1]) * 60 + parseInt(match[2])
}
