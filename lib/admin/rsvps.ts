import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import type { Rsvp } from '@/lib/events'

/**
 * Admin-side RSVP reads. Lives outside lib/events.ts so the public data
 * layer stays untouched; same single-field-query convention (filter on
 * eventId, sort in memory — no composite index needed).
 */

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
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
    partySize:
      typeof data.partySize === 'number' && Number.isFinite(data.partySize)
        ? data.partySize
        : 1,
    notes: asString(data.notes),
    status: status === 'waitlist' || status === 'cancelled' ? status : 'confirmed',
    manageToken: asString(data.manageToken) ?? '',
    createdAt: asString(data.createdAt) ?? new Date(0).toISOString(),
  }
}

/** All RSVPs for an event, oldest first. */
export async function listRsvpsForEvent(eventId: string): Promise<Rsvp[]> {
  const snapshot = await adminDb().collection('rsvps').where('eventId', '==', eventId).get()
  return snapshot.docs
    .map((doc) => toRsvp(doc.id, doc.data()))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}
