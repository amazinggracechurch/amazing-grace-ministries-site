import { z } from 'zod'
import { adminGuard } from '@/lib/admin/guard'
import { getMemberRole, setMemberRole } from '@/lib/admin/members'

/**
 * POST /api/admin/members/role { uid, role }
 *
 * Grants or revokes staff access. The 'superadmin' role is privileged: only
 * a superadmin actor can grant it, and only a superadmin actor can modify a
 * member who currently holds it. The mutation itself (claims + users doc
 * mirror + audit) lives in lib/admin/members.ts.
 */

export const runtime = 'nodejs'

const bodySchema = z.object({
  uid: z.string().min(1).max(200),
  role: z.enum(['member', 'admin', 'superadmin']),
})

export async function POST(request: Request) {
  const guard = await adminGuard()
  if (!guard.ok) return guard.response
  const actor = guard.user

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return Response.json({ error: 'invalid_request' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return Response.json({ error: 'invalid_request' }, { status: 400 })
  }
  const { uid, role } = parsed.data

  const isSuperadminActor = actor.role === 'superadmin'
  if (role === 'superadmin' && !isSuperadminActor) {
    return Response.json({ error: 'forbidden' }, { status: 403 })
  }
  const targetRole = await getMemberRole(uid)
  if (targetRole === 'superadmin' && !isSuperadminActor) {
    return Response.json({ error: 'forbidden' }, { status: 403 })
  }

  try {
    await setMemberRole(actor.uid, actor.email, uid, role)
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: unknown }).code === 'auth/user-not-found'
    ) {
      return Response.json({ error: 'not_found' }, { status: 404 })
    }
    console.error('[admin role] setMemberRole failed', {
      targetUid: uid,
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.json({ error: 'role_update_failed' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
