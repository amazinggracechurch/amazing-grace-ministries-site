import 'server-only'
import { getSessionUser, type SessionUser } from '@/lib/auth/session'

/**
 * Shared guard for /api/admin/* route handlers. Returns the session user
 * when they hold the 'admin' or 'superadmin' role, null otherwise.
 * Callers translate null into 401 (signed out) / 403 (signed in, not
 * staff) — use `adminGuardResponse` below for the standard pair.
 */
export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser()
  if (!user) return null
  if (user.role !== 'admin' && user.role !== 'superadmin') return null
  return user
}

export type AdminGuardResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: Response }

/**
 * One-call guard: 401 when there is no session, 403 when the session is
 * not staff. Every /api/admin/* mutation starts with this.
 */
export async function adminGuard(): Promise<AdminGuardResult> {
  const session = await getSessionUser()
  if (!session) {
    return { ok: false, response: Response.json({ error: 'Sign in required.' }, { status: 401 }) }
  }
  if (session.role !== 'admin' && session.role !== 'superadmin') {
    return { ok: false, response: Response.json({ error: 'Admin access required.' }, { status: 403 }) }
  }
  return { ok: true, user: session }
}
