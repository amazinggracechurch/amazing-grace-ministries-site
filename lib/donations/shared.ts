/**
 * Shared donation vocabulary — safe to import from both client and server
 * (no secrets, no Stripe client).
 */

export const FUNDS = ['Offering', 'Tithes', 'Missions', 'Building', 'Welfare', 'Childrens'] as const
export type Fund = (typeof FUNDS)[number]

export const FUND_LABELS: Record<Fund, string> = {
  Offering: 'General Offering',
  Tithes: 'Tithes',
  Missions: 'Missions & Outreach',
  Building: 'Building Fund',
  Welfare: 'Welfare Fund',
  Childrens: 'Children\'s Ministry',

}

export const FREQUENCIES = ['one-time', 'weekly', 'biweekly', 'monthly'] as const
export type Frequency = (typeof FREQUENCIES)[number]

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  'one-time': 'One-time',
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
}

/** Stripe subscription interval for a recurring frequency. */
export const RECURRING_INTERVALS: Record<
  Exclude<Frequency, 'one-time'>,
  { interval: 'week' | 'month'; interval_count: number }
> = {
  weekly: { interval: 'week', interval_count: 1 },
  biweekly: { interval: 'week', interval_count: 2 },
  monthly: { interval: 'month', interval_count: 1 },
}

/** Shape of a successful POST /api/donations/intent response. */
export type IntentResponse = {
  clientSecret: string
  totalCents: number
  feeCents: number
  /** Present only for recurring gifts. */
  subscriptionId?: string
}
