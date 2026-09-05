import 'server-only'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'

/**
 * Firestore data layer for member pledges (spec §7.4). Server-only.
 *
 * Pledged-money semantics — `projects/{id}.pledgedAmountCents` tracks money
 * that is promised but not yet received (the lighter segment behind the
 * raised fill):
 * - `createPledge` adds the pledge's face value to it.
 * - `applyGiftToPledge` moves money from "pledged" to "raised" as gifts
 *   arrive: the project's pledged total drops by the amount applied, and
 *   at 100% the pledge flips to 'fulfilled' — a fulfilled pledge's
 *   remaining amount is by then zero, so nothing stays counted as pledged.
 * - `cancelPledge` releases the unfulfilled remainder.
 * Every mutation runs in a transaction so the pledge document and the
 * project's aggregate can never drift apart.
 */

export type PledgeFrequency = 'one-time' | 'monthly' | 'quarterly'
export type PledgeStatus = 'active' | 'fulfilled' | 'cancelled'

export type Pledge = {
  id: string
  userId: string
  projectId: string
  amountCents: number
  fulfilledAmountCents: number
  frequency: PledgeFrequency
  /** ISO 8601 instant. */
  startDate: string
  endDate: string | null
  status: PledgeStatus
  createdAt: string
}

export type PledgeErrorCode =
  | 'project_not_found'
  | 'project_closed'
  | 'pledge_not_found'
  | 'forbidden'

export class PledgeError extends Error {
  readonly code: PledgeErrorCode
  constructor(code: PledgeErrorCode, message: string) {
    super(message)
    this.name = 'PledgeError'
    this.code = code
  }
}

const PLEDGE_FREQUENCIES: readonly PledgeFrequency[] = ['one-time', 'monthly', 'quarterly']
const PLEDGE_STATUSES: readonly PledgeStatus[] = ['active', 'fulfilled', 'cancelled']

// --- defensive mapping ---

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function asCents(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0
}

function toPledge(id: string, data: Record<string, unknown>): Pledge {
  const frequency = asString(data.frequency)
  const status = asString(data.status)
  return {
    id,
    userId: asString(data.userId) ?? '',
    projectId: asString(data.projectId) ?? '',
    amountCents: asCents(data.amountCents),
    fulfilledAmountCents: asCents(data.fulfilledAmountCents),
    frequency: PLEDGE_FREQUENCIES.includes(frequency as PledgeFrequency)
      ? (frequency as PledgeFrequency)
      : 'one-time',
    startDate: asString(data.startDate) ?? new Date(0).toISOString(),
    endDate: asString(data.endDate),
    status: PLEDGE_STATUSES.includes(status as PledgeStatus)
      ? (status as PledgeStatus)
      : 'active',
    createdAt: asString(data.createdAt) ?? new Date(0).toISOString(),
  }
}

/** Unfulfilled remainder — what this pledge still counts toward "pledged". */
export function pledgeRemainingCents(pledge: Pledge): number {
  return Math.max(0, pledge.amountCents - pledge.fulfilledAmountCents)
}

// --- reads ---

export async function getPledgesForUser(userId: string): Promise<Pledge[]> {
  const snapshot = await adminDb()
    .collection('pledges')
    .where('userId', '==', userId)
    .get()
  return snapshot.docs
    .map((doc) => toPledge(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// --- writes ---

/**
 * Creates a pledge and adds its face value to the project's
 * `pledgedAmountCents`, atomically. Only 'active' projects accept pledges.
 */
export async function createPledge(input: {
  userId: string
  projectId: string
  amountCents: number
  frequency: PledgeFrequency
  endDate?: string | null
}): Promise<Pledge> {
  const db = adminDb()
  const projectRef = db.collection('projects').doc(input.projectId)
  const pledgeRef = db.collection('pledges').doc()
  const now = new Date().toISOString()

  return db.runTransaction(async (tx) => {
    const projectSnap = await tx.get(projectRef)
    if (!projectSnap.exists) {
      throw new PledgeError('project_not_found', 'This project could not be found.')
    }
    if (projectSnap.data()!.status !== 'active') {
      throw new PledgeError('project_closed', 'This project is not accepting pledges.')
    }

    const record: Omit<Pledge, 'id'> = {
      userId: input.userId,
      projectId: input.projectId,
      amountCents: input.amountCents,
      fulfilledAmountCents: 0,
      frequency: input.frequency,
      startDate: now,
      endDate: input.endDate ?? null,
      status: 'active',
      createdAt: now,
    }
    tx.set(pledgeRef, record)
    tx.update(projectRef, {
      pledgedAmountCents: FieldValue.increment(input.amountCents),
      updatedAt: now,
    })
    return { id: pledgeRef.id, ...record }
  })
}

/**
 * Applies a gift to a pledge document: raises `fulfilledAmountCents`
 * (capped at the pledge amount), moves the applied amount out of the
 * project's `pledgedAmountCents`, and flips to 'fulfilled' at 100%.
 * Returns the applied cents (0 when the pledge was already settled), so
 * callers can tell a no-op apart from a real application.
 */
async function applyGiftToPledgeDoc(pledgeId: string, amountCents: number): Promise<number> {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) return 0
  const db = adminDb()
  const pledgeRef = db.collection('pledges').doc(pledgeId)

  return db.runTransaction(async (tx) => {
    const pledgeSnap = await tx.get(pledgeRef)
    if (!pledgeSnap.exists) {
      throw new PledgeError('pledge_not_found', 'This pledge could not be found.')
    }
    const pledge = toPledge(pledgeSnap.id, pledgeSnap.data()!)
    if (pledge.status !== 'active') return 0

    const projectRef = db.collection('projects').doc(pledge.projectId)
    const projectSnap = await tx.get(projectRef)

    const fulfilled = Math.min(pledge.amountCents, pledge.fulfilledAmountCents + amountCents)
    const applied = fulfilled - pledge.fulfilledAmountCents
    if (applied === 0) return 0

    const now = new Date().toISOString()
    tx.update(pledgeRef, {
      fulfilledAmountCents: fulfilled,
      ...(fulfilled >= pledge.amountCents ? { status: 'fulfilled' } : {}),
    })
    if (projectSnap.exists) {
      tx.update(projectRef, {
        pledgedAmountCents: FieldValue.increment(-applied),
        updatedAt: now,
      })
    }
    return applied
  })
}

/**
 * Applies a gift to the signed-in user's open pledge for a project (the
 * webhook path: metadata identifies donor + project, not the pledge).
 * Returns the applied cents, or 0 when the user has no open pledge there.
 */
export async function applyGiftToPledge(input: {
  userId: string
  projectId: string
  amountCents: number
}): Promise<number> {
  const snapshot = await adminDb()
    .collection('pledges')
    .where('userId', '==', input.userId)
    .where('projectId', '==', input.projectId)
    .get()
  const open = snapshot.docs
    .map((doc) => toPledge(doc.id, doc.data()))
    .filter((pledge) => pledge.status === 'active')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0]
  if (!open) return 0
  return applyGiftToPledgeDoc(open.id, input.amountCents)
}

/** Applies a gift to a specific pledge (the webhook's metadata.pledgeId path). */
export async function applyGiftToPledgeById(
  pledgeId: string,
  amountCents: number
): Promise<number> {
  return applyGiftToPledgeDoc(pledgeId, amountCents)
}

/**
 * Cancels a member's own pledge and releases its unfulfilled remainder
 * from the project's `pledgedAmountCents`. Already-cancelled pledges are a
 * no-op (idempotent for double-clicks/retries); fulfilled pledges have
 * nothing left to release.
 */
export async function cancelPledge(id: string, userId: string): Promise<Pledge> {
  const db = adminDb()
  const pledgeRef = db.collection('pledges').doc(id)

  return db.runTransaction(async (tx) => {
    const pledgeSnap = await tx.get(pledgeRef)
    if (!pledgeSnap.exists) {
      throw new PledgeError('pledge_not_found', 'This pledge could not be found.')
    }
    const pledge = toPledge(pledgeSnap.id, pledgeSnap.data()!)
    if (pledge.userId !== userId) {
      throw new PledgeError('forbidden', 'This pledge belongs to another member.')
    }

    const projectRef = db.collection('projects').doc(pledge.projectId)
    // All reads happen before any write (Firestore transaction requirement).
    const projectSnap = pledge.status === 'active' ? await tx.get(projectRef) : null

    if (pledge.status !== 'active') return pledge

    tx.update(pledgeRef, { status: 'cancelled' })
    const remaining = pledgeRemainingCents(pledge)
    if (projectSnap?.exists && remaining > 0) {
      tx.update(projectRef, {
        pledgedAmountCents: FieldValue.increment(-remaining),
        updatedAt: new Date().toISOString(),
      })
    }
    return { ...pledge, status: 'cancelled' }
  })
}
