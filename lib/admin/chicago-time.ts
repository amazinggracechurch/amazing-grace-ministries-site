/**
 * America/Chicago wall-time helpers for the admin event form. Events are
 * entered as church-local wall time (datetime-local has no zone) and stored
 * as ISO 8601 instants. Client-safe — Intl only, no server imports.
 */

export const CHURCH_TIMEZONE = 'America/Chicago'

const LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

/** The zone's UTC offset (ms) at a given instant. */
function zoneOffsetMs(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  // 'hour' can read 24 at midnight in some engines — normalize to 0.
  const hour = get('hour') % 24
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'))
  return asUtc - at.getTime()
}

/**
 * "2026-10-03T09:00" (church-local) → ISO instant, or null when malformed.
 * Two-pass offset lookup so dates on a DST boundary resolve correctly.
 */
export function churchLocalToIso(local: string, timeZone: string = CHURCH_TIMEZONE): string | null {
  const match = LOCAL_RE.exec(local.trim())
  if (!match) return null
  const [, y, mo, d, h, mi] = match
  const guess = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi))
  let utc = guess - zoneOffsetMs(new Date(guess), timeZone)
  utc = guess - zoneOffsetMs(new Date(utc), timeZone)
  return new Date(utc).toISOString()
}

/** ISO instant → "YYYY-MM-DDTHH:mm" church-local, for datetime-local inputs. */
export function isoToChurchLocal(iso: string, timeZone: string = CHURCH_TIMEZONE): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const hour = String(Number(get('hour')) % 24).padStart(2, '0')
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`
}
