import { adminDb } from '@/lib/firebase/admin'
import { recordAudit } from '@/lib/audit'
import { adminGuard } from '@/lib/admin/guard'
import { eventInputSchema } from '@/lib/admin/events-schema'
import { CHURCH_TIMEZONE, churchLocalToIso } from '@/lib/admin/chicago-time'
import { getEventById } from '@/lib/events'

/**
 * Update an event. POST only, admin-only, audited. rsvpCount is owned by
 * the RSVP transactions and is never written here.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await adminGuard()
  if (!guard.ok) return guard.response

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = eventInputSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid event details.' },
      { status: 400 }
    )
  }
  const input = parsed.data

  const startAt = churchLocalToIso(input.startAt)
  const endAt = input.endAt ? churchLocalToIso(input.endAt) : null
  if (!startAt || (input.endAt && !endAt)) {
    return Response.json({ error: 'Start or end time is not a valid date.' }, { status: 400 })
  }
  if (endAt && endAt <= startAt) {
    return Response.json({ error: 'End time must be after the start time.' }, { status: 400 })
  }

  try {
    const before = await getEventById(id)
    if (!before) {
      return Response.json({ error: 'Event not found.' }, { status: 404 })
    }

    const db = adminDb()
    if (input.slug !== before.slug) {
      const existing = await db
        .collection('events')
        .where('slug', '==', input.slug)
        .limit(1)
        .get()
      if (!existing.empty && existing.docs[0]!.id !== id) {
        return Response.json({ error: 'That slug is already in use.' }, { status: 409 })
      }
    }

    const record = {
      title: input.title,
      slug: input.slug,
      description: input.description,
      flyerImage: input.flyerImage,
      startAt,
      endAt,
      timezone: CHURCH_TIMEZONE,
      location: { name: input.locationName, address: input.locationAddress },
      capacity: input.capacity,
      priceCents: input.priceCents,
      status: input.status,
      featured: input.featured,
    }
    await db.collection('events').doc(id).update(record)

    await recordAudit({
      actorUid: guard.user.uid,
      actorEmail: guard.user.email,
      action: 'update',
      collection: 'events',
      docId: id,
      before,
      after: record,
    })

    return Response.json({ ok: true, id })
  } catch (error) {
    console.error('[admin/events] update failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.json({ error: 'Could not save the event. Please try again.' }, { status: 500 })
  }
}
