/**
 * Donation persistence boundary for the Stripe webhook.
 *
 * The webhook route only talks to the `DonationStore` interface. The
 * Firestore implementation is used whenever the Admin SDK is configured;
 * otherwise an in-memory fallback keeps local development possible and
 * warns loudly on boot. Every method is async so the swap is invisible
 * to the webhook.
 *
 * Firestore layout (see AGM_BUILD_PROMPT.md §9):
 *   donations/{autoId}        — written ONLY by the webhook
 *   stripe_events/{eventId}   — idempotency guard; existence = processed
 *
 * Amounts are integer cents everywhere.
 */

import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import { has } from '@/lib/env'
import { FieldValue } from 'firebase-admin/firestore'

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

class FirestoreDonationStore implements DonationStore {
  async hasProcessed(eventId: string): Promise<boolean> {
    const doc = await adminDb().collection('stripe_events').doc(eventId).get()
    return doc.exists
  }

  async recordDonation(donation: DonationRecord): Promise<void> {
    await adminDb()
      .collection('donations')
      .add({ ...donation, recordedAt: FieldValue.serverTimestamp() })
  }

  async markEventProcessed(eventId: string): Promise<void> {
    await adminDb()
      .collection('stripe_events')
      .doc(eventId)
      .set({ processedAt: FieldValue.serverTimestamp() })
  }

  async updateSubscriptionStatus(subscriptionId: string, status: string): Promise<void> {
    await adminDb()
      .collection('donations')
      .where('subscriptionId', '==', subscriptionId)
      .where('frequency', '!=', 'one-time')
      .limit(1)
      .get()
      .then(async (snapshot) => {
        if (snapshot.empty) return
        await snapshot.docs[0]!.ref.update({
          subscriptionStatus: status,
          updatedAt: FieldValue.serverTimestamp(),
        })
      })
  }
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
    console.info('[donations] recorded (in-memory)', {
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
    console.info('[donations] subscription status (in-memory)', { subscriptionId, status })
  }
}

const globalStore = globalThis as typeof globalThis & { __agmDonationStore?: DonationStore }

export function getDonationStore(): DonationStore {
  if (!globalStore.__agmDonationStore) {
    if (has.firebaseAdmin()) {
      globalStore.__agmDonationStore = new FirestoreDonationStore()
    } else {
      console.warn(
        'WARNING: Firebase Admin not configured — donation store is in-memory. ' +
          'Donations and processed-event ids are lost on restart.'
      )
      globalStore.__agmDonationStore = new InMemoryDonationStore()
    }
  }
  return globalStore.__agmDonationStore
}
