import 'server-only'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { fullName, splitDisplayName } from '@/lib/names'
import { signRsvpToken } from '@/lib/tokens'

/**
 * Firestore data layer for events + RSVPs (spec §6.5 / §9). Server-only —
 * every function talks to Firestore through the Admin SDK.
 *
 * Capacity semantics:
 * - `event.rsvpCount` counts CONFIRMED SEATS (partySize-weighted), not RSVP
 *   records, so "N spots left" is honest when parties are larger than one.
 * - An RSVP is `confirmed` when its party fits in the remaining seats,
 *   otherwise `waitlist`. Waitlist RSVPs do not move `rsvpCount`.
 * - `cancelRsvp` frees seats and promotes the oldest waitlist RSVP that fits
 *   in the freed capacity, all inside one transaction.
 *
 * Query-shape note: all reads filter on a single field and sort/filter the
 * rest in memory. This deliberately avoids composite-index requirements so
 * the feature works against a fresh Firestore database with zero index setup.
 */

export type EventStatus = 'draft' | 'published' | 'cancelled'

export type EventLocation = {
  name: string
  address: string
  lat?: number
  lng?: number
}

export type ChurchEvent = {
  id: string
  title: string
  slug: string
  flyerImage: string | null
  description: string
  /** ISO 8601 instant (offset allowed). */
  startAt: string
  endAt: string | null
  /** IANA zone used for display + calendar invites. */
  timezone: string
  location: EventLocation
  /** Total seats; null = unlimited. */
  capacity: number | null
  /** Integer cents per seat; null or 0 = free. */
  priceCents: number | null
  /** Confirmed seats (partySize-weighted). */
  rsvpCount: number
  status: EventStatus
  featured: boolean
  createdAt: string
}

export type RsvpStatus = 'confirmed' | 'waitlist' | 'cancelled'

export type Rsvp = {
  id: string
  eventId: string
  userId: string | null
  /** Full display name — kept in sync with firstName/lastName for legacy readers. */
  name: string
  /** Structured name parts; null on docs that predate the split. */
  firstName: string | null
  lastName: string | null
  email: string
  phone: string | null
  partySize: number
  notes: string | null
  status: RsvpStatus
  manageToken: string
  createdAt: string
}

export type RsvpInput = {
  eventId: string
  /** Structured name parts (preferred). */
  firstName?: string | null
  lastName?: string | null
  /** Legacy single-field name (Stripe ticketed-RSVP webhook); split on write. */
  name?: string
  email: string
  phone?: string | null
  partySize: number
  notes?: string | null
  userId?: string | null
}

export type RsvpErrorCode =
  | 'event_not_found'
  | 'event_closed'
  | 'rsvp_not_found'

export class RsvpError extends Error {
  readonly code: RsvpErrorCode
  constructor(code: RsvpErrorCode, message: string) {
    super(message)
    this.name = 'RsvpError'
    this.code = code
  }
}

// --- defensive mapping (Firestore data is untyped; never trust it blindly) ---

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function toChurchEvent(id: string, data: Record<string, unknown>): ChurchEvent {
  const locationData =
    typeof data.location === 'object' && data.location !== null
      ? (data.location as Record<string, unknown>)
      : {}
  const status = asString(data.status)
  return {
    id,
    title: asString(data.title) ?? 'Untitled event',
    slug: asString(data.slug) ?? id,
    flyerImage: asString(data.flyerImage),
    description: asString(data.description) ?? '',
    startAt: asString(data.startAt) ?? new Date(0).toISOString(),
    endAt: asString(data.endAt),
    timezone: asString(data.timezone) ?? 'America/Chicago',
    location: {
      name: asString(locationData.name) ?? '',
      address: asString(locationData.address) ?? '',
      ...(asNumber(locationData.lat) !== null ? { lat: asNumber(locationData.lat)! } : {}),
      ...(asNumber(locationData.lng) !== null ? { lng: asNumber(locationData.lng)! } : {}),
    },
    capacity: asNumber(data.capacity),
    priceCents: asNumber(data.priceCents),
    rsvpCount: asNumber(data.rsvpCount) ?? 0,
    status: status === 'draft' || status === 'cancelled' ? status : 'published',
    featured: data.featured === true,
    createdAt: asString(data.createdAt) ?? new Date(0).toISOString(),
  }
}

function toRsvp(id: string, data: Record<string, unknown>): Rsvp {
  const status = asString(data.status)
  return {
    id,
    eventId: asString(data.eventId) ?? '',
    userId: asString(data.userId),
    name: asString(data.name) ?? '',
    firstName: asString(data.firstName),
    lastName: asString(data.lastName),
    email: asString(data.email) ?? '',
    phone: asString(data.phone),
    partySize: asNumber(data.partySize) ?? 1,
    notes: asString(data.notes),
    status: status === 'waitlist' || status === 'cancelled' ? status : 'confirmed',
    manageToken: asString(data.manageToken) ?? signRsvpToken(id),
    createdAt: asString(data.createdAt) ?? new Date(0).toISOString(),
  }
}

// --- reads ---

/** All published events, ordered by startAt asc (sorted in memory — see header). */
export async function listPublishedEvents(): Promise<ChurchEvent[]> {
  const snapshot = await adminDb()
    .collection('events')
    .where('status', '==', 'published')
    .get()
  return snapshot.docs
    .map((doc) => toChurchEvent(doc.id, doc.data()))
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
}

/** Split a startAt-ordered list into upcoming / past relative to `now`. */
export function splitEventsByTime(
  events: ChurchEvent[],
  now: Date = new Date()
): { upcoming: ChurchEvent[]; past: ChurchEvent[] } {
  const nowIso = now.toISOString()
  const upcoming: ChurchEvent[] = []
  const past: ChurchEvent[] = []
  for (const event of events) {
    if (event.startAt >= nowIso) upcoming.push(event)
    else past.push(event)
  }
  // Most recent past event first.
  past.reverse()
  return { upcoming, past }
}

/** A single published event by slug, or null (drafts/cancelled 404 publicly). */
export async function getEventBySlug(slug: string): Promise<ChurchEvent | null> {
  const snapshot = await adminDb()
    .collection('events')
    .where('slug', '==', slug)
    .limit(1)
    .get()
  const doc = snapshot.docs[0]
  if (!doc) return null
  const event = toChurchEvent(doc.id, doc.data())
  return event.status === 'published' ? event : null
}

export async function getEventById(id: string): Promise<ChurchEvent | null> {
  const doc = await adminDb().collection('events').doc(id).get()
  return doc.exists ? toChurchEvent(doc.id, doc.data()!) : null
}

export async function getRsvpById(id: string): Promise<Rsvp | null> {
  const doc = await adminDb().collection('rsvps').doc(id).get()
  return doc.exists ? toRsvp(doc.id, doc.data()!) : null
}

// --- writes ---

/**
 * Creates an RSVP in a single transaction: reads the event, decides
 * confirmed vs waitlist from remaining capacity, writes the RSVP, and bumps
 * `rsvpCount` (confirmed only) with FieldValue.increment.
 */
export async function createRsvp(
  input: RsvpInput
): Promise<{ rsvp: Rsvp; event: ChurchEvent }> {
  const db = adminDb()
  const eventRef = db.collection('events').doc(input.eventId)
  const rsvpRef = db.collection('rsvps').doc()

  return db.runTransaction(async (tx) => {
    const eventSnap = await tx.get(eventRef)
    if (!eventSnap.exists) {
      throw new RsvpError('event_not_found', 'This event could not be found.')
    }
    const event = toChurchEvent(eventSnap.id, eventSnap.data()!)
    if (event.status !== 'published') {
      throw new RsvpError('event_closed', 'RSVPs are closed for this event.')
    }

    const seatsLeft =
      event.capacity === null ? Infinity : event.capacity - event.rsvpCount
    const status: RsvpStatus = input.partySize <= seatsLeft ? 'confirmed' : 'waitlist'

    // Structured parts win; a legacy single-field `name` (Stripe ticketed
    // webhook) is split best-effort so every RSVP carries firstName/lastName.
    const legacy = splitDisplayName(input.name)
    const firstName = input.firstName ?? legacy.firstName
    const lastName = input.lastName ?? legacy.lastName

    const record: Omit<Rsvp, 'id'> = {
      eventId: event.id,
      userId: input.userId ?? null,
      name: fullName(firstName, lastName) || (input.name ?? ''),
      firstName,
      lastName,
      email: input.email,
      phone: input.phone ?? null,
      partySize: input.partySize,
      notes: input.notes ?? null,
      status,
      manageToken: signRsvpToken(rsvpRef.id),
      createdAt: new Date().toISOString(),
    }
    tx.set(rsvpRef, record)
    if (status === 'confirmed') {
      tx.update(eventRef, { rsvpCount: FieldValue.increment(input.partySize) })
    }

    return { rsvp: { id: rsvpRef.id, ...record }, event }
  })
}

/**
 * Cancels an RSVP in a single transaction. If the RSVP held confirmed seats,
 * those seats are freed and the oldest waitlist RSVP that fits in the freed
 * capacity is promoted (and the event count adjusted by the net difference).
 *
 * The waitlist lookup filters on `eventId` only and picks the oldest
 * `waitlist` entry in memory — a second `status` filter would require a
 * composite index (see header note).
 *
 * Already-cancelled RSVPs are a no-op (idempotent for double-clicks/retries).
 */
export async function cancelRsvp(
  rsvpId: string
): Promise<{ rsvp: Rsvp; event: ChurchEvent; promoted: Rsvp | null }> {
  const db = adminDb()
  const rsvpRef = db.collection('rsvps').doc(rsvpId)

  return db.runTransaction(async (tx) => {
    const rsvpSnap = await tx.get(rsvpRef)
    if (!rsvpSnap.exists) {
      throw new RsvpError('rsvp_not_found', 'This RSVP could not be found.')
    }
    const rsvp = toRsvp(rsvpSnap.id, rsvpSnap.data()!)

    const eventRef = db.collection('events').doc(rsvp.eventId)
    // All reads happen before any write (Firestore transaction requirement).
    const eventSnap = await tx.get(eventRef)
    if (!eventSnap.exists) {
      throw new RsvpError('event_not_found', 'The event for this RSVP no longer exists.')
    }
    const event = toChurchEvent(eventSnap.id, eventSnap.data()!)
    const candidatesSnap =
      rsvp.status === 'confirmed'
        ? await tx.get(
            db.collection('rsvps').where('eventId', '==', rsvp.eventId)
          )
        : null

    if (rsvp.status === 'cancelled') {
      return { rsvp, event, promoted: null }
    }

    tx.update(rsvpRef, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    })
    const cancelled: Rsvp = { ...rsvp, status: 'cancelled' }

    if (rsvp.status !== 'confirmed') {
      // Waitlist seats were never counted — nothing to free or promote.
      return { rsvp: cancelled, event, promoted: null }
    }

    const seatsAfterCancel =
      event.capacity === null
        ? Infinity
        : event.capacity - (event.rsvpCount - rsvp.partySize)

    const oldestWaitlist = (candidatesSnap?.docs ?? [])
      .map((doc) => toRsvp(doc.id, doc.data()))
      .filter((candidate) => candidate.status === 'waitlist')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0]

    const docById = new Map((candidatesSnap?.docs ?? []).map((doc) => [doc.id, doc]))

    if (oldestWaitlist && oldestWaitlist.partySize <= seatsAfterCancel) {
      const promoted: Rsvp = { ...oldestWaitlist, status: 'confirmed' }
      tx.update(docById.get(oldestWaitlist.id)!.ref, {
        status: 'confirmed',
        promotedAt: new Date().toISOString(),
      })
      tx.update(eventRef, {
        rsvpCount: FieldValue.increment(promoted.partySize - rsvp.partySize),
      })
      return { rsvp: cancelled, event, promoted }
    }

    tx.update(eventRef, { rsvpCount: FieldValue.increment(-rsvp.partySize) })
    return { rsvp: cancelled, event, promoted: null }
  })
}

/** "N spots left" for display; null when the event has no capacity. */
export function spotsLeft(event: ChurchEvent): number | null {
  if (event.capacity === null) return null
  return Math.max(0, event.capacity - event.rsvpCount)
}
