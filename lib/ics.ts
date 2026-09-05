import 'server-only'

/**
 * Minimal iCalendar (RFC 5545) builder — just enough for a single-VEVENT
 * invite attached to the RSVP confirmation email. Includes a VTIMEZONE for
 * America/Chicago so DTSTART;TZID resolves correctly in strict parsers.
 */

export type IcsEvent = {
  uid: string
  title: string
  description?: string | null
  location?: string | null
  /** ISO 8601 instant. */
  startAt: string
  /** ISO 8601 instant; defaults to start + 2 hours when null. */
  endAt?: string | null
  timeZone?: string
}

const DEFAULT_TIME_ZONE = 'America/Chicago'

/** Escape TEXT values per RFC 5545 §3.3.11. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/**
 * Fold a content line to 75 octets: continuation lines start with a single
 * space (RFC 5545 §3.1). Byte-aware so multi-byte UTF-8 isn't split mid-codepoint.
 */
function foldLine(line: string): string {
  const LIMIT = 75
  if (Buffer.byteLength(line, 'utf8') <= LIMIT) return line
  const chunks: string[] = []
  let current = ''
  let currentBytes = 0
  // First line may use 75 octets; continuations start with a space, so 74.
  let limit = LIMIT
  for (const char of line) {
    const charBytes = Buffer.byteLength(char, 'utf8')
    if (currentBytes + charBytes > limit) {
      chunks.push(current)
      current = ' ' + char
      currentBytes = 1 + charBytes
      limit = LIMIT
    } else {
      current += char
      currentBytes += charBytes
    }
  }
  chunks.push(current)
  return chunks.join('\r\n')
}

/** `20261003T090000` wall-clock time in the given IANA zone. */
function formatLocal(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}${get('month')}${get('day')}T${get('hour')}${get('minute')}${get('second')}`
}

/** `20261003T140000Z` UTC timestamp (for DTSTAMP). */
function formatUtc(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

const VTIMEZONE_CHICAGO = [
  'BEGIN:VTIMEZONE',
  'TZID:America/Chicago',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:-0600',
  'TZOFFSETTO:-0500',
  'TZNAME:CDT',
  'DTSTART:19700308T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:-0500',
  'TZOFFSETTO:-0600',
  'TZNAME:CST',
  'DTSTART:19701101T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
]

/** Build a complete text/calendar document containing one VEVENT. */
export function buildIcsCalendar(event: IcsEvent): string {
  const timeZone = event.timeZone ?? DEFAULT_TIME_ZONE
  const start = new Date(event.startAt)
  const end =
    event.endAt != null
      ? new Date(event.endAt)
      : new Date(start.getTime() + 2 * 60 * 60 * 1000)

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Amazing Grace Ministries MN//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...(timeZone === DEFAULT_TIME_ZONE ? VTIMEZONE_CHICAGO : []),
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${formatUtc(new Date())}`,
    `DTSTART;TZID=${timeZone}:${formatLocal(event.startAt, timeZone)}`,
    `DTEND;TZID=${timeZone}:${formatLocal(end.toISOString(), timeZone)}`,
    `SUMMARY:${escapeText(event.title)}`,
    ...(event.description ? [`DESCRIPTION:${escapeText(event.description)}`] : []),
    ...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.map(foldLine).join('\r\n') + '\r\n'
}
