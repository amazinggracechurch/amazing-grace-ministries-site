import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import type { ChurchEvent } from '@/lib/events'

/**
 * Admin-side event reads. lib/events.ts only exposes published events;
 * the admin list needs drafts and cancelled ones too. Kept separate so
 * the public data layer stays untouched.
 */

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
    },
    capacity: asNumber(data.capacity),
    priceCents: asNumber(data.priceCents),
    rsvpCount: asNumber(data.rsvpCount) ?? 0,
    status: status === 'draft' || status === 'cancelled' ? status : 'published',
    featured: data.featured === true,
    createdAt: asString(data.createdAt) ?? new Date(0).toISOString(),
  }
}

/** Every event regardless of status, soonest first. */
export async function listAllEvents(): Promise<ChurchEvent[]> {
  const snapshot = await adminDb().collection('events').get()
  return snapshot.docs
    .map((doc) => toChurchEvent(doc.id, doc.data()))
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
}
