import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import { FUNDS } from '@/lib/donations/shared'
import type { DonationRecord } from '@/lib/donations/store'
import {
  chicagoDateKey,
  computeGivingStats,
  summarizeFunds,
  type FundSummaryRow,
  type GivingStats,
} from './giving'

/**
 * Firestore reads for the admin giving dashboard (spec §7.6).
 *
 * Repo convention: NO composite indexes — the donations volume for a single
 * church is small (hundreds, not millions), so every query is a plain
 * collection read with in-memory filter/sort/paginate. Writes happen ONLY in
 * the Stripe webhook; this module never mutates the ledger.
 */

export type Donation = DonationRecord & {
  id: string
  /** Firebase Auth uid when the gift was linked to a member account. */
  userId: string | null
}

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function cents(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) ? value : null
}

async function fetchAllDonations(): Promise<Donation[]> {
  const snapshot = await adminDb().collection('donations').get()
  return snapshot.docs
    .map((doc) => {
      const source = doc.get('source')
      return {
        id: doc.id,
        eventId: str(doc.get('eventId')) ?? '',
        paymentIntentId: str(doc.get('paymentIntentId')),
        subscriptionId: str(doc.get('subscriptionId')),
        amountCents: cents(doc.get('amountCents')) ?? 0,
        baseAmountCents: cents(doc.get('baseAmountCents')),
        feeCents: cents(doc.get('feeCents')),
        fund: str(doc.get('fund')),
        frequency: str(doc.get('frequency')),
        donorEmail: str(doc.get('donorEmail')),
        coveredFee: doc.get('coveredFee') === true,
        source: source === 'web' || source === 'qr' ? source : 'unknown',
        status: str(doc.get('status')) ?? 'unknown',
        createdAt: str(doc.get('createdAt')) ?? new Date(0).toISOString(),
        userId: str(doc.get('userId')),
      } satisfies Donation
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export const DONATION_STATUSES = ['succeeded', 'failed', 'refunded'] as const
export const DONATION_SOURCES = ['web', 'qr', 'unknown'] as const

export type DonationFilters = {
  fund?: string
  source?: string
  status?: string
  /** YYYY-MM-DD, inclusive, in America/Chicago. */
  from?: string
  /** YYYY-MM-DD, inclusive, in America/Chicago. */
  to?: string
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

/**
 * Validate raw query params into ledger filters. Anything unrecognized is
 * dropped — filter params are never trusted blindly.
 */
export function parseDonationFilters(params: {
  fund?: string
  source?: string
  status?: string
  from?: string
  to?: string
}): DonationFilters {
  const filters: DonationFilters = {}
  if (params.fund && (FUNDS as readonly string[]).includes(params.fund)) {
    filters.fund = params.fund
  }
  if (params.source && (DONATION_SOURCES as readonly string[]).includes(params.source)) {
    filters.source = params.source
  }
  if (params.status && (DONATION_STATUSES as readonly string[]).includes(params.status)) {
    filters.status = params.status
  }
  if (params.from && DATE_KEY.test(params.from)) filters.from = params.from
  if (params.to && DATE_KEY.test(params.to)) filters.to = params.to
  return filters
}

function matches(donation: Donation, filters: DonationFilters): boolean {
  if (filters.fund && donation.fund !== filters.fund) return false
  if (filters.source && donation.source !== filters.source) return false
  if (filters.status && donation.status !== filters.status) return false
  if (filters.from || filters.to) {
    const key = chicagoDateKey(donation.createdAt)
    if (filters.from && key < filters.from) return false
    if (filters.to && key > filters.to) return false
  }
  return true
}

export type DonationPage = {
  donations: Donation[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function listDonations(
  options: DonationFilters & { page?: number; pageSize?: number }
): Promise<DonationPage> {
  const pageSize = Math.max(1, Math.min(options.pageSize ?? 25, 500))
  const filtered = (await fetchAllDonations()).filter((d) => matches(d, options))
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const page = Math.max(1, Math.min(options.page ?? 1, totalPages))
  return {
    donations: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    pageSize,
    totalPages,
  }
}

/** Every donation matching the filters — for the CSV export. */
export async function listAllDonations(filters: DonationFilters): Promise<Donation[]> {
  return (await fetchAllDonations()).filter((d) => matches(d, filters))
}

/** Per-fund totals + counts over succeeded gifts in the date range. */
export async function fundSummary(range: {
  from?: string
  to?: string
}): Promise<FundSummaryRow[]> {
  const inRange = (await fetchAllDonations()).filter((d) =>
    matches(d, { from: range.from, to: range.to })
  )
  return summarizeFunds(inRange)
}

/** This week / month / year totals, average gift, recurring-vs-one-time split. */
export async function givingStats(now: Date = new Date()): Promise<GivingStats> {
  return computeGivingStats(await fetchAllDonations(), now)
}
