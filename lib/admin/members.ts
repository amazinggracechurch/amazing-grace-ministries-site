import 'server-only'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { recordAudit } from '@/lib/audit'
import type { Role } from '@/lib/auth/session'

/**
 * Member administration (spec §7.6): the users/{uid} profile collection is
 * the source of truth for display, Firebase Auth custom claims are the
 * source of truth for authorization — setMemberRole writes BOTH and audits
 * the change. Reads follow the repo convention: plain collection reads with
 * in-memory filter/sort/paginate, no composite indexes.
 */

export type MemberRecord = {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  role: Role
  phone: string | null
  /** ISO date (YYYY-MM-DD) the member optionally shares for birthday care. */
  birthdate: string | null
  /** Ministry interest groups the member marked in their portal profile. */
  interests: string[]
  /** ISO string, or null when the profile predates timestamps. */
  createdAt: string | null
}

const ROLES: readonly Role[] = ['member', 'admin', 'superadmin']

function toIso(value: unknown): string | null {
  if (
    value !== null &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: unknown }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  return typeof value === 'string' ? value : null
}

function toMember(uid: string, data: Record<string, unknown>): MemberRecord {
  const role = data.role
  return {
    uid,
    email: typeof data.email === 'string' ? data.email : null,
    displayName: typeof data.displayName === 'string' ? data.displayName : null,
    photoURL: typeof data.photoURL === 'string' ? data.photoURL : null,
    role: ROLES.includes(role as Role) ? (role as Role) : 'member',
    phone: typeof data.phone === 'string' ? data.phone : null,
    birthdate: typeof data.birthdate === 'string' ? data.birthdate : null,
    interests: Array.isArray(data.interests)
      ? data.interests.filter((i): i is string => typeof i === 'string')
      : [],
    createdAt: toIso(data.createdAt),
  }
}

export type MemberPage = {
  members: MemberRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Newest members first; `query` is a case-insensitive substring match on
 * display name and email.
 */
export async function listMembers(options: {
  query?: string
  page?: number
  pageSize?: number
}): Promise<MemberPage> {
  const pageSize = Math.max(1, Math.min(options.pageSize ?? 25, 200))
  const snapshot = await adminDb().collection('users').get()
  let members = snapshot.docs.map((doc) => toMember(doc.id, doc.data()))

  const query = options.query?.trim().toLowerCase()
  if (query) {
    members = members.filter(
      (m) =>
        m.displayName?.toLowerCase().includes(query) ||
        m.email?.toLowerCase().includes(query)
    )
  }

  members.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

  const totalPages = Math.max(1, Math.ceil(members.length / pageSize))
  const page = Math.max(1, Math.min(options.page ?? 1, totalPages))
  return {
    members: members.slice((page - 1) * pageSize, page * pageSize),
    total: members.length,
    page,
    pageSize,
    totalPages,
  }
}

export type GivingTotal = { count: number; totalCents: number }

export type MemberGiving = {
  byUid: Map<string, GivingTotal>
  byEmail: Map<string, GivingTotal>
}

/**
 * Succeeded-gift aggregates keyed by linked uid AND by donor email — gifts
 * predate member accounts, so the members page falls back to the email key.
 */
export async function memberGiving(): Promise<MemberGiving> {
  const snapshot = await adminDb().collection('donations').get()
  const byUid = new Map<string, GivingTotal>()
  const byEmail = new Map<string, GivingTotal>()
  const add = (map: Map<string, GivingTotal>, key: string, amountCents: number) => {
    const entry = map.get(key) ?? { count: 0, totalCents: 0 }
    entry.count += 1
    entry.totalCents += amountCents
    map.set(key, entry)
  }
  for (const doc of snapshot.docs) {
    if (doc.get('status') !== 'succeeded') continue
    const amount = doc.get('amountCents')
    if (typeof amount !== 'number' || !Number.isInteger(amount)) continue
    const uid = doc.get('userId')
    if (typeof uid === 'string' && uid) add(byUid, uid, amount)
    const email = doc.get('donorEmail')
    if (typeof email === 'string' && email) add(byEmail, email.toLowerCase(), amount)
  }
  return { byUid, byEmail }
}

/** Current mirrored role for a user doc, or null when the doc is missing. */
export async function getMemberRole(uid: string): Promise<Role | null> {
  const snapshot = await adminDb().collection('users').doc(uid).get()
  if (!snapshot.exists) return null
  const role = snapshot.get('role')
  return ROLES.includes(role as Role) ? (role as Role) : 'member'
}

/**
 * Change a member's role: custom claim (auth boundary) + users/{uid}.role
 * (display mirror), refresh tokens revoked so the new claim takes effect on
 * the next sign-in, and an audit entry — role changes are non-negotiable
 * audit territory. The 'superadmin-only grants superadmin' rule is enforced
 * by the caller (the API route knows the actor's role).
 */
export async function setMemberRole(
  actorUid: string,
  actorEmail: string | null,
  targetUid: string,
  role: Role
): Promise<void> {
  const before = await getMemberRole(targetUid)

  const authUser = await adminAuth().getUser(targetUid)
  await adminAuth().setCustomUserClaims(targetUid, {
    ...authUser.customClaims,
    role,
  })
  await adminDb().collection('users').doc(targetUid).set({ role }, { merge: true })
  await adminAuth().revokeRefreshTokens(targetUid)

  await recordAudit({
    actorUid,
    actorEmail,
    action: 'role',
    collection: 'users',
    docId: targetUid,
    before: { role: before },
    after: { role },
  })
}
