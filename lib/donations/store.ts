/**
 * Donation persistence boundary for the Stripe webhook.
 *
 * Phase 1 ships an in-memory implementation so the webhook contract is real
 * and testable today. Phase 2 swaps in Firestore by implementing the same
 * `DonationStore` interface — the webhook route will not change. Every
 * method is async from day one so the swap is mechanical.
 *
 * Amounts are integer cents everywhere.
 */

export type DonationRecord = {
  /** Stripe event id that produced this record (idempotency anchor). */
  eventId: string
  paymentIntentId: string | null
  subscriptionId: string | null
  /** Total charged, integer cents (base + covered fee if any). */
  amountCents: number
  /** Gift amount before any covered fee, integer cents; null when unknown. */
  baseAmountCents: number | null
  feeCents: number | null
  fund: string | null
  frequency: string | null
  donorEmail: string | null
  coveredFee: boolean
  source: 'web' | 'qr' | 'unknown'
  /** 'succeeded' | 'failed' | 'refunded' | ... */
  status: string
  createdAt: string
}

export interface DonationStore {
  hasProcessed(eventId: string): Promise<boolean>
  recordDonation(donation: DonationRecord): Promise<void>
  markEventProcessed(eventId: string): Promise<void>
  updateSubscriptionStatus(subscriptionId: string, status: string): Promise<void>
}

class InMemoryDonationStore implements DonationStore {
  private processedEvents = new Set<string>()
  private donations: DonationRecord[] = []
  private subscriptions = new Map<string, string>()

  async hasProcessed(eventId: string): Promise<boolean> {
    return this.processedEvents.has(eventId)
  }

  async recordDonation(donation: DonationRecord): Promise<void> {
    this.donations.push(donation)
    console.info('[donations] recorded', {
      paymentIntentId: donation.paymentIntentId,
      subscriptionId: donation.subscriptionId,
      amountCents: donation.amountCents,
      fund: donation.fund,
      status: donation.status,
    })
  }

  async markEventProcessed(eventId: string): Promise<void> {
    this.processedEvents.add(eventId)
  }

  async updateSubscriptionStatus(subscriptionId: string, status: string): Promise<void> {
    this.subscriptions.set(subscriptionId, status)
    console.info('[donations] subscription status', { subscriptionId, status })
  }
}

const globalStore = globalThis as typeof globalThis & { __agmDonationStore?: DonationStore }

export function getDonationStore(): DonationStore {
  if (!globalStore.__agmDonationStore) {
    console.warn(
      'WARNING: donation store is in-memory — Firebase lands in Phase 2. ' +
        'Donations and processed-event ids are lost on restart.'
    )
    globalStore.__agmDonationStore = new InMemoryDonationStore()
  }
  return globalStore.__agmDonationStore
}
