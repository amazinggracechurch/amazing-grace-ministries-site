import { adminDb } from '@/lib/firebase/admin'
import { recordAudit } from '@/lib/audit'
import { adminGuard } from '@/lib/admin/guard'
import { projectInputSchema } from '@/lib/admin/projects-schema'
import { getProjectById } from '@/lib/projects'

/**
 * Update a funding project. POST only, admin-only, audited.
 * Only editorial fields are writable here — raised/pledged/donorCount are
 * owned by the donation webhook and pledge flows and are never touched.
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

  const parsed = projectInputSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid project details.' },
      { status: 400 }
    )
  }

  try {
    const before = await getProjectById(id)
    if (!before) {
      return Response.json({ error: 'Project not found.' }, { status: 404 })
    }

    const db = adminDb()
    if (parsed.data.slug !== before.slug) {
      const existing = await db
        .collection('projects')
        .where('slug', '==', parsed.data.slug)
        .limit(1)
        .get()
      if (!existing.empty && existing.docs[0]!.id !== id) {
        return Response.json({ error: 'That slug is already in use.' }, { status: 409 })
      }
    }

    await db
      .collection('projects')
      .doc(id)
      .update({ ...parsed.data, updatedAt: new Date().toISOString() })

    await recordAudit({
      actorUid: guard.user.uid,
      actorEmail: guard.user.email,
      action: 'update',
      collection: 'projects',
      docId: id,
      before,
      after: parsed.data,
    })

    return Response.json({ ok: true, id })
  } catch (error) {
    console.error('[admin/projects] update failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.json({ error: 'Could not save the project. Please try again.' }, { status: 500 })
  }
}
