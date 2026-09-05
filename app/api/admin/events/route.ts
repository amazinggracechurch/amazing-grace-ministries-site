import { adminDb } from '@/lib/firebase/admin'
import { recordAudit } from '@/lib/audit'
import { adminGuard } from '@/lib/admin/guard'
import { eventInputSchema } from '@/lib/admin/events-schema'
import { CHURCH_TIMEZONE, churchLocalToIso } from '@/lib/admin/chicago-time'

/**
 * Create an event. POST only, admin-only, audited.
 * rsvpCount starts at zero and is owned by the RSVP transactions.
 */
export async function POST(request: Request) {
  const guard = await adminGuard()
  if (!guard.ok) return guard.response

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
    const db = adminDb()
    const existing = await db
      .collection('events')
      .where('slug', '==', input.slug)
      .limit(1)
      .get()
    if (!existing.empty) {
      return Response.json({ error: 'That slug is already in use.' }, { status: 409 })
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
      rsvpCount: 0,
      status: input.status,
      featured: input.featured,
      createdAt: new Date().toISOString(),
    }
    const ref = await db.collection('events').add(record)

    await recordAudit({
      actorUid: guard.user.uid,
      actorEmail: guard.user.email,
      action: 'create',
      collection: 'events',
      docId: ref.id,
      after: record,
    })

    return Response.json({ ok: true, id: ref.id })
  } catch (error) {
    console.error('[admin/events] create failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.json({ error: 'Could not save the event. Please try again.' }, { status: 500 })
  }
}
