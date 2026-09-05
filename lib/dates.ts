import type { EventLocation } from '@/lib/events'

/**
 * Display formatting for event dates/times. Everything runs through
 * Intl.DateTimeFormat pinned to the event's timezone (America/Chicago) so
 * server-rendered pages show church-local wall time regardless of where the
 * server runs. Shared by server components and client confirmation states.
 */

function inZone(iso: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', { timeZone, ...options }).format(new Date(iso))
}

/** e.g. "Saturday, October 3, 2026" */
export function formatEventDate(iso: string, timeZone: string): string {
  return inZone(iso, timeZone, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** e.g. "9:00 AM" */
export function formatEventTime(iso: string, timeZone: string): string {
  return inZone(iso, timeZone, { hour: 'numeric', minute: '2-digit' })
}

/** e.g. "9:00 AM – 11:00 AM CT", or just the start time when no end. */
export function formatEventTimeRange(
  startAt: string,
  endAt: string | null,
  timeZone: string
): string {
  const start = formatEventTime(startAt, timeZone)
  if (!endAt) return start
  return `${start} – ${formatEventTime(endAt, timeZone)}`
}

/** Three-letter uppercase month for the typographic date cards, e.g. "OCT". */
export function eventMonth(iso: string, timeZone: string): string {
  return inZone(iso, timeZone, { month: 'short' }).toUpperCase()
}

/** Two-digit day of month for the typographic date cards, e.g. "03". */
export function eventDay(iso: string, timeZone: string): string {
  return inZone(iso, timeZone, { day: '2-digit' })
}

/** e.g. "Saturday" */
export function eventWeekday(iso: string, timeZone: string): string {
  return inZone(iso, timeZone, { weekday: 'long' })
}

/** Google Maps query URL for a "Get Directions" link. */
export function directionsUrl(location: EventLocation): string {
  const query = location.address || location.name
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
