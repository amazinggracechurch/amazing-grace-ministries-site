import { describe, expect, it, vi } from 'vitest'

// The module under test is server-only in the Next build; in unit tests the
// marker package would throw on import, so it is stubbed out.
vi.mock('server-only', () => ({}))

import { isReminderDue } from '@/lib/pledge-reminders'
import type { Pledge } from '@/lib/pledges'

const NOW = new Date('2026-09-05T15:00:00.000Z')
const DAY_MS = 24 * 60 * 60 * 1000

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * DAY_MS).toISOString()
}

function makePledge(overrides: Partial<Pledge> = {}): Pledge {
  return {
    id: 'p1',
    userId: 'u1',
    projectId: 'proj1',
    amountCents: 100_00,
    fulfilledAmountCents: 25_00,
    frequency: 'monthly',
    startDate: daysAgo(30),
    endDate: null,
    status: 'active',
    createdAt: daysAgo(30),
    ...overrides,
  }
}

describe('isReminderDue', () => {
  it('is due for an active pledge with money remaining and no prior reminder', () => {
    expect(isReminderDue(makePledge(), NOW)).toBe(true)
  })

  it('is not due when the pledge is fully fulfilled', () => {
    expect(
      isReminderDue(makePledge({ status: 'fulfilled', fulfilledAmountCents: 100_00 }), NOW)
    ).toBe(false)
  })

  it('is not due when nothing remains, even while still active', () => {
    expect(isReminderDue(makePledge({ fulfilledAmountCents: 100_00 }), NOW)).toBe(false)
  })

  it('is not due for a cancelled pledge', () => {
    expect(isReminderDue(makePledge({ status: 'cancelled' }), NOW)).toBe(false)
  })

  it('is not due once the end date has passed', () => {
    expect(isReminderDue(makePledge({ endDate: daysAgo(1) }), NOW)).toBe(false)
  })

  it('is not due when a reminder went out 3 days ago', () => {
    expect(isReminderDue(makePledge({ lastReminderAt: daysAgo(3) }), NOW)).toBe(false)
  })

  it('is due again 7 days after the last reminder', () => {
    expect(isReminderDue(makePledge({ lastReminderAt: daysAgo(7) }), NOW)).toBe(true)
  })
})
