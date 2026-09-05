import { adminDb } from '@/lib/firebase/admin'
import { recordAudit } from '@/lib/audit'
import { adminGuard } from '@/lib/admin/guard'
import { projectInputSchema } from '@/lib/admin/projects-schema'

/**
 * Create a funding project. POST only, admin-only, audited.
 * Counters (raised/pledged/donorCount) always start at zero — they only
 * move through incrementProjectProgress and the pledge flow.
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

  const parsed = projectInputSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid project details.' },
      { status: 400 }
    )
  }

  try {
    const db = adminDb()
    // Slugs must be unique — they route the public /projects/[slug] pages.
    const existing = await db
      .collection('projects')
      .where('slug', '==', parsed.data.slug)
      .limit(1)
      .get()
    if (!existing.empty) {
      return Response.json({ error: 'That slug is already in use.' }, { status: 409 })
    }

    const now = new Date().toISOString()
    const ref = await db.collection('projects').add({
      ...parsed.data,
      gallery: [],
      raisedAmountCents: 0,
      pledgedAmountCents: 0,
      donorCount: 0,
      createdAt: now,
      updatedAt: now,
    })

    await recordAudit({
      actorUid: guard.user.uid,
      actorEmail: guard.user.email,
      action: 'create',
      collection: 'projects',
      docId: ref.id,
      after: parsed.data,
    })

    return Response.json({ ok: true, id: ref.id })
  } catch (error) {
    console.error('[admin/projects] create failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.json({ error: 'Could not save the project. Please try again.' }, { status: 500 })
  }
}
