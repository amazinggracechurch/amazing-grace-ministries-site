import type Stripe from 'stripe'
import { env, has } from '@/lib/env'
import { getDonationStore, type DonationRecord } from '@/lib/donations/store'
import { getStripe } from '@/lib/stripe'
import { createRsvp } from '@/lib/events'
import { rsvpManageUrl, sendRsvpConfirmationEmail } from '@/lib/rsvp-email'
import { adminAuth } from '@/lib/firebase/admin'
import { incrementProjectProgress } from '@/lib/projects'
import { applyGiftToPledge, applyGiftToPledgeById } from '@/lib/pledges'

/**
 * Stripe webhook receiver. POST only.
 *
 * - Verifies the signature against the RAW body (`await request.text()`),
 *   trying every configured signing secret (test endpoint, prod endpoint
 *   carried over from the previous site, local stripe listen).
 * - Idempotent via the donation store's processed-event set (Firestore
 *   stripe_events/{eventId}).
 * - Donations are recorded in Firestore ONLY here; project progress and
 *   pledge fulfillment are credited transactionally on success events.
 * - Unknown event types are acknowledged with 200 and a logged note, so
 *   Stripe doesn't retry them forever.
 */

function sourceOf(value: string | undefined): DonationRecord['source'] {
  return value === 'web' || value === 'qr' ? value : 'unknown'
}

function donationFromMetadata(
  eventId: string,
  status: string,
  amountCents: number,
  metadata: Stripe.Metadata | null,
  ids: { paymentIntentId?: string | null; subscriptionId?: string | null; method?: string | null }
): DonationRecord {
  return {
    eventId,
    paymentIntentId: ids.paymentIntentId ?? null,
    subscriptionId: ids.subscriptionId ?? null,
    amountCents,
    baseAmountCents: metadata?.baseAmountCents ? Number(metadata.baseAmountCents) : null,
    feeCents: metadata?.feeCents ? Number(metadata.feeCents) : null,
    fund: metadata?.fund ?? null,
    frequency: metadata?.frequency ?? null,
    donorEmail: metadata?.donorEmail || null,
    coveredFee: metadata?.coveredFee === 'true',
    source: sourceOf(metadata?.source),
    projectId: metadata?.projectId ?? null,
    method: ids.method ?? null,
    status,
    createdAt: new Date().toISOString(),
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return Response.json({ error: 'Missing stripe-signature header.' }, { status: 400 })
  }

  if (!has.stripe() || !has.stripeWebhook()) {
    return Response.json({ error: 'Webhook is not configured.' }, { status: 503 })
  }

  const body = await request.text()

  // Try each configured signing secret (test endpoint, production
  // endpoint carried over from the previous site, local stripe listen).
  let event: Stripe.Event | null = null
  for (const secret of env.stripeWebhookSecrets()) {
    try {
      event = getStripe().webhooks.constructEvent(body, signature, secret)
      break
    } catch {
      // Not signed with this secret — try the next one.
    }
  }
  if (!event) {
    console.warn('[stripe webhook] signature verification failed against all configured secrets')
    return Response.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  const store = getDonationStore()

  if (await store.hasProcessed(event.id)) {
    return Response.json({ received: true, duplicate: true })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        await store.recordDonation(
          donationFromMetadata(event.id, 'succeeded', pi.amount, pi.metadata, {
            paymentIntentId: pi.id,
            method: pi.payment_method_types?.[0] ?? null,
          })
        )
        // Funding-project credit (spec §7.4): the donation is already
        // recorded, so everything below is best-effort — it logs and never
        // fails the webhook.
        if (pi.metadata?.projectId) {
          try {
            const baseCents = pi.metadata.baseAmountCents
              ? Number(pi.metadata.baseAmountCents)
              : pi.amount
            const projectId = pi.metadata.projectId
            const donorEmail = pi.metadata.donorEmail || null
            await incrementProjectProgress(projectId, baseCents, donorEmail)
            if (donorEmail) {
              if (pi.metadata.pledgeId) {
                // The gift named its pledge outright — apply directly.
                await applyGiftToPledgeById(pi.metadata.pledgeId, baseCents)
              } else {
                // Match the donor email to a signed-in member and apply the
                // gift to their open pledge on this project, if one exists.
                const authUser = await adminAuth()
                  .getUserByEmail(donorEmail)
                  .catch(() => null)
                if (authUser) {
                  await applyGiftToPledge({
                    userId: authUser.uid,
                    projectId,
                    amountCents: baseCents,
                  })
                }
              }
            }
          } catch (error) {
            console.error('[stripe webhook] project credit failed', {
              paymentIntentId: pi.id,
              projectId: pi.metadata.projectId,
              message: error instanceof Error ? error.message : 'unknown',
            })
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent
        await store.recordDonation(
          donationFromMetadata(event.id, 'failed', pi.amount, pi.metadata, {
            paymentIntentId: pi.id,
          })
        )
        console.warn('[stripe webhook] payment failed', {
          paymentIntentId: pi.id,
          decline: pi.last_payment_error?.decline_code ?? pi.last_payment_error?.code ?? null,
        })
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId =
          typeof charge.payment_intent === 'string' ? charge.payment_intent : null
        await store.recordDonation(
          donationFromMetadata(event.id, 'refunded', charge.amount_refunded, charge.metadata, {
            paymentIntentId,
          })
        )
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionDetails = invoice.parent?.subscription_details ?? null
        const subscriptionId =
          typeof subscriptionDetails?.subscription === 'string'
            ? subscriptionDetails.subscription
            : null
        const metadata = subscriptionDetails?.metadata ?? invoice.metadata
        await store.recordDonation(
          donationFromMetadata(event.id, 'succeeded', invoice.amount_paid, metadata, {
            subscriptionId,
          })
        )
        // Recurring project gifts: subscription metadata carries projectId
        // (the invoice's own PaymentIntent does not), so project credit for
        // recurring gifts happens here, never in payment_intent.succeeded —
        // which also means no double-counting of the first invoice.
        if (metadata?.projectId) {
          try {
            const baseCents = metadata.baseAmountCents
              ? Number(metadata.baseAmountCents)
              : invoice.amount_paid
            const donorEmail = metadata.donorEmail || null
            await incrementProjectProgress(metadata.projectId, baseCents, donorEmail)
            if (donorEmail) {
              const authUser = await adminAuth()
                .getUserByEmail(donorEmail)
                .catch(() => null)
              if (authUser) {
                await applyGiftToPledge({
                  userId: authUser.uid,
                  projectId: metadata.projectId,
                  amountCents: baseCents,
                })
              }
            }
          } catch (error) {
            console.error('[stripe webhook] recurring project credit failed', {
              subscriptionId,
              projectId: metadata.projectId,
              message: error instanceof Error ? error.message : 'unknown',
            })
          }
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await store.updateSubscriptionStatus(subscription.id, subscription.status)
        break
      }

      // Ticketed event RSVPs (spec §6.5): /api/rsvps/checkout creates the
      // Checkout Session; the RSVP is written ONLY here, on completed payment.
      // Idempotent via the same stripe_events processed-event guard above.
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.metadata ?? {}
        if (metadata.type !== 'rsvp') {
          console.info('[stripe webhook] checkout.session.completed without rsvp metadata, acknowledging')
          break
        }
        const partySize = Number(metadata.partySize)
        if (!metadata.eventId || !metadata.name || !metadata.email || !Number.isInteger(partySize) || partySize < 1) {
          console.error('[stripe webhook] rsvp session missing metadata', { sessionId: session.id })
          break
        }
        // createRsvp re-checks capacity in a transaction — a payment that
        // completes after sell-out lands on the waitlist instead of overselling.
        const { rsvp, event: rsvpEvent } = await createRsvp({
          eventId: metadata.eventId,
          name: metadata.name,
          email: metadata.email,
          phone: metadata.phone || null,
          partySize,
        })
        const manageUrl = rsvpManageUrl(rsvp.id, rsvp.manageToken)
        await sendRsvpConfirmationEmail({ rsvp, event: rsvpEvent, manageUrl })
        break
      }

      default:
        console.info('[stripe webhook] unhandled event type, acknowledging', {
          type: event.type,
        })
    }
  } catch (error) {
    // A 500 tells Stripe to retry; the processed-event set keeps retries safe.
    console.error('[stripe webhook] handler failed', {
      type: event.type,
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.json({ error: 'Webhook handler failed.' }, { status: 500 })
  }

  await store.markEventProcessed(event.id)
  return Response.json({ received: true })
}
