import { adminDb } from '@/lib/firebase/admin'
import { recordAudit } from '@/lib/audit'
import { adminGuard } from '@/lib/admin/guard'
import { getProjectById } from '@/lib/projects'

/**
 * Archive a project (soft delete — it disappears from public lists but
 * the donation history it is joined to stays intact). POST, admin-only.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await adminGuard()
  if (!guard.ok) return guard.response

  const { id } = await params

  try {
    const before = await getProjectById(id)
    if (!before) {
      return Response.json({ error: 'Project not found.' }, { status: 404 })
    }

    await adminDb()
      .collection('projects')
      .doc(id)
      .update({ status: 'archived', updatedAt: new Date().toISOString() })

    await recordAudit({
      actorUid: guard.user.uid,
      actorEmail: guard.user.email,
      action: 'archive',
      collection: 'projects',
      docId: id,
      before: { status: before.status },
      after: { status: 'archived' },
    })

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[admin/projects] archive failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.json({ error: 'Could not archive the project. Please try again.' }, { status: 500 })
  }
}
