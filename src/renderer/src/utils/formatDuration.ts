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

/**
 * Flexible time input parser — returns minutes, or null when unparseable.
 *
 * Accepted formats (case-insensitive, comma or dot as decimal):
 *   "1"        → 60 min   (plain integer or decimal = hours)
 *   "1.5"      → 90 min
 *   "1:20"     → 80 min   (H:MM or H:M colon format)
 *   "0:20"     → 20 min
 *   "1h"       → 60 min
 *   "1 h"      → 60 min
 *   "1.5h"     → 90 min
 *   "20m"      → 20 min
 *   "20 m"     → 20 min
 *   "20min"    → 20 min
 *   "1h 20m"   → 80 min
 *   "1h20m"    → 80 min
 *   "1h 20min" → 80 min
 */
export function parseTimeInput(raw: string): number | null {
  if (!raw) return null
  const s = raw.trim().toLowerCase().replace(',', '.')

  // "1h 20m" / "1h20m" / "1 h 20 m" / "1hr 20min" etc.
  const hm = s.match(/^(\d+(?:\.\d+)?)\s*h(?:r|rs|our|ours)?\s*(\d+)\s*m(?:in|ins|inute|inutes)?$/)
  if (hm) {
    const mins = parseInt(hm[2])
    if (mins > 59) return null
    return Math.round(parseFloat(hm[1]) * 60) + mins
  }

  // "1h" / "1.5h" / "1 h" / "1hr" / "1hour"
  const hOnly = s.match(/^(\d+(?:\.\d+)?)\s*h(?:r|rs|our|ours)?$/)
  if (hOnly) {
    return Math.round(parseFloat(hOnly[1]) * 60)
  }

  // "20m" / "20 m" / "20min" / "20minutes"
  const mOnly = s.match(/^(\d+)\s*m(?:in|ins|inute|inutes)?$/)
  if (mOnly) {
    return parseInt(mOnly[1])
  }

  // "1:20" / "1:5" / "01:30" — colon format
  const colon = s.match(/^(\d+):(\d{1,2})$/)
  if (colon) {
    const mins = parseInt(colon[2])
    if (mins > 59) return null
    return parseInt(colon[1]) * 60 + mins
  }

  // Plain number → hours ("1" = 60 min, "1.5" = 90 min)
  const plain = s.match(/^(\d+(?:\.\d+)?)$/)
  if (plain) {
    return Math.round(parseFloat(plain[1]) * 60)
  }

  return null
}
