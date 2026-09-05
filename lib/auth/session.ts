import 'server-only'
import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase/admin'

/**
 * Server-side session reader. Reads the `__session` cookie minted by
 * app/api/auth/session/route.ts and verifies it against Firebase Auth
 * with revocation checking. Safe to call from any server component,
 * layout, or route handler — returns null rather than throwing.
 */

export type Role = 'member' | 'admin' | 'superadmin'

export type SessionUser = {
  uid: string
  email: string | null
  name: string | null
  photoURL: string | null
  role: Role
}

const SESSION_COOKIE_NAME = '__session'

const ROLES: readonly Role[] = ['member', 'admin', 'superadmin']

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const cookie = store.get(SESSION_COOKIE_NAME)?.value
  if (!cookie) return null

  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, true)
    const claim = (decoded as Record<string, unknown>).role
    const role: Role = ROLES.includes(claim as Role) ? (claim as Role) : 'member'
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
      photoURL: decoded.picture ?? null,
      role,
    }
  } catch {
    // Expired, revoked, or malformed cookie — treat as signed out.
    return null
  }
}
