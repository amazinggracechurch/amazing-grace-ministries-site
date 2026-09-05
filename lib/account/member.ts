import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import type { DonationRecord } from '@/lib/donations/store'
import { chicagoDateKey } from '@/lib/admin/giving'
import { getEventById, type ChurchEvent, type Rsvp, type RsvpStatus } from '@/lib/events'
import { signRsvpToken } from '@/lib/tokens'

/**
 * Member-scoped Firestore reads for the account portal (spec §7.5).
 *
 * Ownership rule everywhere: a record belongs to the signed-in member when
 * `userId == uid` OR the record's email equals the member's account email —
 * the second leg picks up guest gifts/RSVPs made with the same email before
 * (or without ever) signing in. The sign-in route already backfills
 * `userId` onto matching donations; the email leg keeps the portal correct
 * even for records that predate that backfill.
 *
 * Query-shape note (repo convention): single-field `where` filters only,
 * merged and sorted in memory — no composite indexes required.
 */

// --- defensive mapping (Firestore data is untyped; never trust it blindly) ---

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function asCents(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null
}

export type MemberDonation = DonationRecord & {
  id: string
  /** Firebase Auth uid, backfilled onto matching-email gifts at sign-in. */
  userId: string | null
  /** Funding-project designation, when the gift named one. */
  projectId: string | null
  /** Payment method label copied from Stripe metadata, when recorded. */
  method: string | null
  /** Latest Stripe subscription status mirrored by the webhook, when known. */
  subscriptionStatus: string | null
}

function toMemberDonation(id: string, data: Record<string, unknown>): MemberDonation {
  const source = asString(data.source)
  return {
    id,
    eventId: asString(data.eventId) ?? '',
    paymentIntentId: asString(data.paymentIntentId),
    subscriptionId: asString(data.subscriptionId),
    amountCents: asCents(data.amountCents) ?? 0,
    baseAmountCents: asCents(data.baseAmountCents),
    feeCents: asCents(data.feeCents),
    fund: asString(data.fund),
    frequency: asString(data.frequency),
    donorEmail: asString(data.donorEmail),
    coveredFee: data.coveredFee === true,
    source: source === 'web' || source === 'qr' ? source : 'unknown',
    status: asString(data.status) ?? 'unknown',
    createdAt: asString(data.createdAt) ?? new Date(0).toISOString(),
    userId: asString(data.userId),
    projectId: asString(data.projectId),
    method: asString(data.method),
    subscriptionStatus: asString(data.subscriptionStatus),
  }
}

/** Every donation owned by this member (uid match OR account-email match). */
export async function getMemberDonations(
  uid: string,
  email: string | null
): Promise<MemberDonation[]> {
  const db = adminDb()
  const byUid = await db.collection('donations').where('userId', '==', uid).get()
  const byEmail = email
    ? await db.collection('donations').where('donorEmail', '==', email).get()
    : null

  const merged = new Map<string, MemberDonation>()
  for (const doc of [...byUid.docs, ...(byEmail?.docs ?? [])]) {
    merged.set(doc.id, toMemberDonation(doc.id, doc.data()))
  }
  return [...merged.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// --- RSVPs ---

function toMemberRsvp(id: string, data: Record<string, unknown>): Rsvp {
  const status = asString(data.status)
  const partySize = typeof data.partySize === 'number' && Number.isInteger(data.partySize)
    ? data.partySize
    : 1
  return {
    id,
    eventId: asString(data.eventId) ?? '',
    userId: asString(data.userId),
    name: asString(data.name) ?? '',
    email: asString(data.email) ?? '',
    phone: asString(data.phone),
    partySize: partySize >= 1 ? partySize : 1,
    notes: asString(data.notes),
    status: (['confirmed', 'waitlist', 'cancelled'] as readonly RsvpStatus[]).includes(
      status as RsvpStatus
    )
      ? (status as RsvpStatus)
      : 'confirmed',
    // Older docs predate the stored token; the signature is deterministic.
    manageToken: asString(data.manageToken) ?? signRsvpToken(id),
    createdAt: asString(data.createdAt) ?? new Date(0).toISOString(),
  }
}

export type MemberRsvp = {
  rsvp: Rsvp
  /** Null when the event was deleted — the RSVP still renders. */
  event: ChurchEvent | null
}

/** Every RSVP owned by this member, joined with its event. */
export async function getMemberRsvps(
  uid: string,
  email: string | null
): Promise<MemberRsvp[]> {
  const db = adminDb()
  const byUid = await db.collection('rsvps').where('userId', '==', uid).get()
  const byEmail = email
    ? await db.collection('rsvps').where('email', '==', email).get()
    : null

  const merged = new Map<string, Rsvp>()
  for (const doc of [...byUid.docs, ...(byEmail?.docs ?? [])]) {
    merged.set(doc.id, toMemberRsvp(doc.id, doc.data()))
  }
  const rsvps = [...merged.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const eventIds = [...new Set(rsvps.map((rsvp) => rsvp.eventId).filter(Boolean))]
  const events = await Promise.all(eventIds.map((id) => getEventById(id).catch(() => null)))
  const eventById = new Map(events.filter(Boolean).map((event) => [event!.id, event!]))

  return rsvps.map((rsvp) => ({ rsvp, event: eventById.get(rsvp.eventId) ?? null }))
}

// --- recurring gifts ---

export type MemberSubscription = {
  subscriptionId: string
  fund: string | null
  frequency: string | null
  /** Most recent charged amount, integer cents (base + covered fee if any). */
  amountCents: number
  /** Stripe status mirrored by the webhook; 'active' until we hear otherwise. */
  status: string
  giftCount: number
  firstGiftAt: string
  lastGiftAt: string
}

/**
 * Groups the member's donations by subscriptionId into one row per recurring
 * gift. Pure — the webhook writes one donation per paid invoice, all sharing
 * the subscriptionId, and mirrors the subscription status onto one of them.
 */
export function summarizeSubscriptions(
  donations: readonly MemberDonation[]
): MemberSubscription[] {
  const groups = new Map<string, MemberDonation[]>()
  for (const donation of donations) {
    if (!donation.subscriptionId) continue
    const group = groups.get(donation.subscriptionId) ?? []
    group.push(donation)
    groups.set(donation.subscriptionId, group)
  }

  const summaries = [...groups.entries()].map(([subscriptionId, group]) => {
    const sorted = [...group].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const latest = sorted[sorted.length - 1]!
    const status =
      sorted.map((d) => d.subscriptionStatus).find((s): s is string => s !== null) ?? 'active'
    return {
      subscriptionId,
      fund: latest.fund,
      frequency: latest.frequency,
      amountCents: latest.amountCents,
      status,
      giftCount: group.length,
      firstGiftAt: sorted[0]!.createdAt,
      lastGiftAt: latest.createdAt,
    } satisfies MemberSubscription
  })

  // Live subscriptions first, then by most recent gift.
  return summaries.sort((a, b) => {
    const aLive = a.status === 'active' || a.status === 'trialing' ? 0 : 1
    const bLive = b.status === 'active' || b.status === 'trialing' ? 0 : 1
    return aLive - bLive || b.lastGiftAt.localeCompare(a.lastGiftAt)
  })
}

// --- year giving totals ---

export type YearGiving = {
  year: number
  /** Total charged, integer cents — includes any donor-covered fees. */
  totalCents: number
  /** Gift amount before covered fees (baseAmountCents, or the charge when none). */
  baseCents: number
  /** Processing fees the donor chose to cover on top of the base gift. */
  coveredFeeCents: number
  giftCount: number
}

/** Succeeded-gift totals for one America/Chicago calendar year. */
export function computeMemberYearGiving(
  donations: readonly MemberDonation[],
  year: number
): YearGiving {
  const giving: YearGiving = { year, totalCents: 0, baseCents: 0, coveredFeeCents: 0, giftCount: 0 }
  for (const donation of donations) {
    if (donation.status !== 'succeeded') continue
    if (!chicagoDateKey(donation.createdAt).startsWith(String(year))) continue
    giving.totalCents += donation.amountCents
    giving.baseCents += donation.baseAmountCents ?? donation.amountCents
    giving.coveredFeeCents += donation.coveredFee ? (donation.feeCents ?? 0) : 0
    giving.giftCount += 1
  }
  return giving
}

/** Distinct America/Chicago years with at least one succeeded gift, newest first. */
export function memberGivingYears(donations: readonly MemberDonation[]): number[] {
  const years = new Set<number>()
  for (const donation of donations) {
    if (donation.status !== 'succeeded') continue
    years.add(Number(chicagoDateKey(donation.createdAt).slice(0, 4)))
  }
  return [...years].sort((a, b) => b - a)
}

// --- member profile (users/{uid}) ---

export type CommunicationPrefs = {
  emailUpdates: boolean
  pledgeReminders: boolean
}

export type MemberProfile = {
  displayName: string | null
  phone: string | null
  email: string | null
  photoURL: string | null
  stripeCustomerId: string | null
  /** Optional ISO date (YYYY-MM-DD) for birthday care. */
  birthdate: string | null
  /** Ministry interest groups the member marked in their profile. */
  interests: string[]
  communicationPrefs: CommunicationPrefs
  createdAt: Date | null
}

/** Reads users/{uid}; null when the profile doc doesn't exist yet. */
export async function getMemberProfile(uid: string): Promise<MemberProfile | null> {
  const snapshot = await adminDb().collection('users').doc(uid).get()
  if (!snapshot.exists) return null
  const data = snapshot.data()!

  const prefsData =
    typeof data.communicationPrefs === 'object' && data.communicationPrefs !== null
      ? (data.communicationPrefs as Record<string, unknown>)
      : {}
  const createdAt = data.createdAt
  return {
    displayName: asString(data.displayName),
    phone: asString(data.phone),
    email: asString(data.email),
    photoURL: asString(data.photoURL),
    stripeCustomerId: asString(data.stripeCustomerId),
    birthdate: asString(data.birthdate),
    interests: Array.isArray(data.interests)
      ? data.interests.filter((i): i is string => typeof i === 'string')
      : [],
    communicationPrefs: {
      emailUpdates: prefsData.emailUpdates !== false,
      pledgeReminders: prefsData.pledgeReminders !== false,
    },
    createdAt:
      createdAt && typeof createdAt === 'object' && 'toDate' in createdAt
        ? (createdAt as { toDate: () => Date }).toDate()
        : null,
  }
}
