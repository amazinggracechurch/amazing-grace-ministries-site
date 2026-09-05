import { describe, expect, it } from 'vitest'
import type { DonationRecord } from '@/lib/donations/store'
import { computeGivingStats, donationsToCsv, summarizeFunds } from './giving'

function gift(overrides: Partial<DonationRecord>): DonationRecord {
  return {
    eventId: 'evt_1',
    paymentIntentId: 'pi_1',
    subscriptionId: null,
    amountCents: 2500,
    baseAmountCents: 2500,
    feeCents: null,
    fund: 'Offering',
    frequency: 'one-time',
    donorEmail: 'donor@example.org',
    coveredFee: false,
    source: 'web',
    status: 'succeeded',
    createdAt: '2026-09-01T15:00:00.000Z',
    ...overrides,
  }
}

describe('computeGivingStats', () => {
  // Friday 2026-09-04, 6pm UTC = 1pm in Chicago. Chicago week (Sun-start)
  // runs 2026-08-30 … 2026-09-05.
  const now = new Date('2026-09-04T18:00:00.000Z')

  it('buckets week/month/year against America/Chicago', () => {
    const stats = computeGivingStats(
      [
        gift({ amountCents: 1000, createdAt: '2026-09-02T15:00:00.000Z' }), // this week
        gift({ amountCents: 2000, createdAt: '2026-08-31T15:00:00.000Z' }), // this week, last month
        gift({ amountCents: 4000, createdAt: '2026-08-20T15:00:00.000Z' }), // last month
        gift({ amountCents: 8000, createdAt: '2026-01-15T15:00:00.000Z' }), // this year
        gift({ amountCents: 16000, createdAt: '2025-12-15T15:00:00.000Z' }), // last year
      ],
      now
    )
    expect(stats.week).toEqual({ totalCents: 3000, count: 2 })
    expect(stats.month).toEqual({ totalCents: 1000, count: 1 })
    expect(stats.year).toEqual({ totalCents: 15000, count: 4 })
  })

  it('treats a late-UTC gift as the previous Chicago day', () => {
    // Gift: 2026-09-06 02:00 UTC = Saturday Sep 5, 9pm in Chicago.
    // Now:  2026-09-06 04:00 UTC = Saturday Sep 5, 11pm in Chicago.
    // UTC has rolled into Sunday; in Chicago both are the same Saturday.
    const stats = computeGivingStats(
      [gift({ amountCents: 5000, createdAt: '2026-09-06T02:00:00.000Z' })],
      new Date('2026-09-06T04:00:00.000Z')
    )
    expect(stats.week).toEqual({ totalCents: 5000, count: 1 })
    expect(stats.month).toEqual({ totalCents: 5000, count: 1 })
  })

  it('ignores failed and refunded gifts', () => {
    const stats = computeGivingStats(
      [
        gift({ status: 'failed', amountCents: 1000 }),
        gift({ status: 'refunded', amountCents: 1000 }),
        gift({ amountCents: 500 }),
      ],
      now
    )
    expect(stats.year).toEqual({ totalCents: 500, count: 1 })
  })

  it('computes the average gift and the recurring split', () => {
    const stats = computeGivingStats(
      [
        gift({ amountCents: 1000, frequency: 'one-time' }),
        gift({ amountCents: 3000, frequency: 'monthly' }),
        gift({ amountCents: 2000, frequency: null }),
      ],
      now
    )
    expect(stats.averageGiftCents).toBe(2000)
    expect(stats.oneTime).toEqual({ totalCents: 3000, count: 2 })
    expect(stats.recurring).toEqual({ totalCents: 3000, count: 1 })
  })

  it('returns zeros for an empty ledger', () => {
    const stats = computeGivingStats([], now)
    expect(stats.year).toEqual({ totalCents: 0, count: 0 })
    expect(stats.averageGiftCents).toBe(0)
  })
})

describe('summarizeFunds', () => {
  it('groups succeeded gifts by fund, sorted by total', () => {
    const rows = summarizeFunds([
      gift({ fund: 'Tithes', amountCents: 5000 }),
      gift({ fund: 'Offering', amountCents: 9000 }),
      gift({ fund: 'Tithes', amountCents: 1000 }),
      gift({ fund: 'Offering', amountCents: 1000, status: 'refunded' }),
      gift({ fund: null, amountCents: 700 }),
    ])
    expect(rows).toEqual([
      { fund: 'Offering', totalCents: 9000, count: 1 },
      { fund: 'Tithes', totalCents: 6000, count: 2 },
      { fund: 'Undesignated', totalCents: 700, count: 1 },
    ])
  })
})

describe('donationsToCsv', () => {
  it('emits the QuickBooks column layout with dollar amounts', () => {
    const csv = donationsToCsv([
      gift({
        amountCents: 2590,
        feeCents: 90,
        frequency: 'monthly',
        createdAt: '2026-09-01T15:00:00.000Z',
      }),
    ])
    const lines = csv.trimEnd().split('\r\n')
    expect(lines[0]).toBe(
      'Date,Email,Fund,Frequency,Amount,Fee,Net,Status,Source,PaymentIntent ID'
    )
    expect(lines[1]).toBe(
      '09/01/2026,donor@example.org,Offering,monthly,25.90,0.90,25.00,succeeded,web,pi_1'
    )
  })

  it('escapes commas and quotes, blanks unknown fee', () => {
    const csv = donationsToCsv([
      gift({ donorEmail: 'a,b@example.org', fund: 'Children "Hope"', feeCents: null }),
    ])
    const row = csv.trimEnd().split('\r\n')[1]
    expect(row).toContain('"a,b@example.org"')
    expect(row).toContain('"Children ""Hope"""')
    // Net equals amount when the fee is unknown.
    expect(row).toContain(',25.00,,25.00,')
  })
})
