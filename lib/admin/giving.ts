import type { DonationRecord } from '@/lib/donations/store'

/**
 * Pure giving math for the admin dashboard — no Firestore, no `server-only`,
 * so it stays unit-testable. lib/admin/donations.ts wraps these with
 * collection reads.
 *
 * All bucketing is done against America/Chicago wall time (the church's
 * timezone): a gift belongs to the day it was given in Minnesota, regardless
 * of where the server runs. Amounts are integer cents everywhere.
 */

export const GIVING_TIME_ZONE = 'America/Chicago'

/** YYYY-MM-DD in America/Chicago — used for date-range filters and CSV dates. */
export function chicagoDateKey(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: GIVING_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

/** e.g. "Sep 5, 2026" — table display, church-local. */
export function formatChicagoDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: GIVING_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

/** Days since the Unix epoch of the gift's Chicago-local calendar day. */
function chicagoDayNumber(iso: string): number {
  const key = chicagoDateKey(iso)
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) / 86_400_000
}

/** Sunday-based week start (US convention) of the given Chicago day number. */
function weekStartDay(dayNumber: number): number {
  const dow = new Date(dayNumber * 86_400_000).getUTCDay() // 0 = Sunday
  return dayNumber - dow
}

export type PeriodStats = { totalCents: number; count: number }

export type GivingStats = {
  week: PeriodStats
  month: PeriodStats
  year: PeriodStats
  /** Mean succeeded gift this year, integer cents; 0 when no gifts. */
  averageGiftCents: number
  /** This-year split: frequency 'one-time' (or unknown) vs everything else. */
  oneTime: PeriodStats
  recurring: PeriodStats
}

function emptyPeriod(): PeriodStats {
  return { totalCents: 0, count: 0 }
}

function add(period: PeriodStats, amountCents: number): void {
  period.totalCents += amountCents
  period.count += 1
}

/**
 * Week / month / year totals from succeeded gifts, computed against `now`
 * in America/Chicago. Future-dated records (bad clocks, tests) are ignored.
 */
export function computeGivingStats(
  donations: readonly DonationRecord[],
  now: Date
): GivingStats {
  const stats: GivingStats = {
    week: emptyPeriod(),
    month: emptyPeriod(),
    year: emptyPeriod(),
    averageGiftCents: 0,
    oneTime: emptyPeriod(),
    recurring: emptyPeriod(),
  }
  const nowIso = now.toISOString()
  const nowDay = chicagoDayNumber(nowIso)
  const nowWeekStart = weekStartDay(nowDay)
  const nowMonthKey = chicagoDateKey(nowIso).slice(0, 7) // YYYY-MM
  const nowYearKey = nowMonthKey.slice(0, 4)

  for (const donation of donations) {
    if (donation.status !== 'succeeded') continue
    const day = chicagoDayNumber(donation.createdAt)
    if (day > nowDay) continue
    const key = chicagoDateKey(donation.createdAt)

    if (day >= nowWeekStart) add(stats.week, donation.amountCents)
    if (key.startsWith(nowMonthKey)) add(stats.month, donation.amountCents)
    if (key.startsWith(nowYearKey)) {
      add(stats.year, donation.amountCents)
      const recurring = donation.frequency !== null && donation.frequency !== 'one-time'
      add(recurring ? stats.recurring : stats.oneTime, donation.amountCents)
    }
  }

  stats.averageGiftCents =
    stats.year.count > 0 ? Math.round(stats.year.totalCents / stats.year.count) : 0
  return stats
}

export type FundSummaryRow = { fund: string; totalCents: number; count: number }

/**
 * Per-fund totals over succeeded gifts. Refunded gifts are excluded — a
 * refund is a separate ledger entry (status 'refunded'), not a negative gift.
 */
export function summarizeFunds(donations: readonly DonationRecord[]): FundSummaryRow[] {
  const byFund = new Map<string, PeriodStats>()
  for (const donation of donations) {
    if (donation.status !== 'succeeded') continue
    const fund = donation.fund ?? 'Undesignated'
    const entry = byFund.get(fund) ?? emptyPeriod()
    add(entry, donation.amountCents)
    byFund.set(fund, entry)
  }
  return [...byFund.entries()]
    .map(([fund, stats]) => ({ fund, ...stats }))
    .sort((a, b) => b.totalCents - a.totalCents || a.fund.localeCompare(b.fund))
}

/** cents -> "1234.56" (no currency symbol — spreadsheet-friendly). */
function dollars(cents: number): string {
  return (cents / 100).toFixed(2)
}

function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/**
 * QuickBooks-friendly CSV of the given ledger rows. Columns:
 * Date (MM/DD/YYYY, America/Chicago), Email, Fund, Frequency, Amount, Fee,
 * Net, Status, Source, PaymentIntent ID. Amounts are plain dollar decimals;
 * Net = Amount − Fee (the fee is 0 when the donor didn't cover it / unknown).
 */
export function donationsToCsv(donations: readonly DonationRecord[]): string {
  const header = [
    'Date',
    'Email',
    'Fund',
    'Frequency',
    'Amount',
    'Fee',
    'Net',
    'Status',
    'Source',
    'PaymentIntent ID',
  ]
  const rows = donations.map((d) => {
    const [y, m, day] = chicagoDateKey(d.createdAt).split('-')
    const fee = d.feeCents ?? 0
    return [
      `${m}/${day}/${y}`,
      d.donorEmail ?? '',
      d.fund ?? '',
      d.frequency ?? '',
      dollars(d.amountCents),
      d.feeCents === null ? '' : dollars(fee),
      dollars(d.amountCents - fee),
      d.status,
      d.source,
      d.paymentIntentId ?? '',
    ]
  })
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
