/**
 * Sermon types and display helpers — safe for both client and server.
 * Data fetching lives in lib/youtube.ts (server-only); client
 * components must import from here instead.
 */

export type Sermon = {
  id: string
  title: string
  publishedAt: string
  durationSeconds: number | null
  thumbnail: string
  url: string
}

/** 4523 → "1:15:23", 612 → "10:12". Null when the duration is unknown. */
export function formatDuration(seconds: number | null): string | null {
  if (seconds === null || !Number.isFinite(seconds)) return null
  const total = Math.max(0, Math.round(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const ss = String(s).padStart(2, '0')
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${ss}`
  return `${m}:${ss}`
}

/** ISO timestamp → "Aug 24, 2025" (UTC, so the date never shifts by timezone). */
export function formatAirDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}
