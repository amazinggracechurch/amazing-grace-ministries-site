import type Stripe from 'stripe'
import AnnouncementBar from '@/components/AnnouncementBar'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import Button from '@/components/ui/Button'
import { has } from '@/lib/env'
import { FUND_LABELS, type Fund } from '@/lib/donations/shared'
import { formatUsd } from '@/lib/money'
import { getStripe } from '@/lib/stripe'

export const metadata = {
  title: 'Thank You | Amazing Grace Ministries MN',
  description: 'Thank you for your gift to Amazing Grace Ministries MN.',
}

type GiftSummary = {
  amountCents: number
  fundLabel: string | null
  frequencyLabel: string
  last4: string | null
  /** Only set when Stripe will actually email a receipt (PI receipt_email). */
  receiptEmail: string | null
  isRecurring: boolean
  status: string
}

function fundLabelOf(metadata: Stripe.Metadata | null): string | null {
  const fund = metadata?.fund
  return fund && fund in FUND_LABELS ? FUND_LABELS[fund as Fund] : null
}

function last4Of(charge: string | Stripe.Charge | null | undefined): string | null {
  if (!charge || typeof charge === 'string') return null
  return charge.payment_method_details?.card?.last4 ?? null
}

function frequencyOf(subscription: Stripe.Subscription): string {
  const recurring = subscription.items.data[0]?.price?.recurring
  if (!recurring) return 'Recurring'
  if (recurring.interval === 'month') return 'Monthly'
  if (recurring.interval === 'week') return recurring.interval_count === 2 ? 'Biweekly' : 'Weekly'
  return 'Recurring'
}

async function loadSummary(
  params: Record<string, string | string[] | undefined>
): Promise<GiftSummary | null> {
  if (!has.stripe()) return null
  const stripe = getStripe()

  const paymentIntentId = typeof params.payment_intent === 'string' ? params.payment_intent : null
  const subscriptionId = typeof params.subscription === 'string' ? params.subscription : null
  const sessionId = typeof params.session_id === 'string' ? params.session_id : null

  try {
    // QR-code gifts land here from hosted Checkout with a session id.
    if (sessionId && !paymentIntentId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent', 'payment_intent.latest_charge'],
      })
      const pi = session.payment_intent
      if (!pi || typeof pi === 'string') return null
      return {
        amountCents: pi.amount,
        fundLabel: fundLabelOf(pi.metadata),
        frequencyLabel: 'One-time',
        last4: last4Of(pi.latest_charge),
        receiptEmail: pi.receipt_email,
        isRecurring: false,
        status: pi.status,
      }
    }

    if (paymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['latest_charge'],
      })
      let frequencyLabel = 'One-time'
      let isRecurring = false
      let fundLabel = fundLabelOf(pi.metadata)
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        frequencyLabel = frequencyOf(subscription)
        isRecurring = true
        fundLabel = fundLabel ?? fundLabelOf(subscription.metadata)
      }
      return {
        amountCents: pi.amount,
        fundLabel,
        frequencyLabel,
        last4: last4Of(pi.latest_charge),
        receiptEmail: pi.receipt_email,
        isRecurring,
        status: pi.status,
      }
    }

    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const unitAmount = subscription.items.data[0]?.price?.unit_amount
      if (unitAmount == null) return null
      return {
        amountCents: unitAmount,
        fundLabel: fundLabelOf(subscription.metadata),
        frequencyLabel: frequencyOf(subscription),
        last4: null,
        receiptEmail: null,
        isRecurring: true,
        status: subscription.status,
      }
    }
  } catch (error) {
    console.warn('[give/confirmation] could not retrieve gift', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return null
  }

  return null
}

export default async function GiveConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const summary = await loadSummary(params)

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <AnnouncementBar />
      <section className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-3xl px-6 py-24 md:py-32">
          {summary ? <Gift summary={summary} /> : <NotFound />}
        </div>
      </section>
      <Footer />
    </main>
  )
}

function Gift({ summary }: { summary: GiftSummary }) {
  const succeeded = summary.status === 'succeeded' || summary.status === 'active'
  return (
    <div>
      <p className="eyebrow text-accent">{succeeded ? 'Gift received' : 'Gift processing'}</p>
      <h1 className="mt-4 font-display text-display-md font-medium tracking-display">
        Thank you for your generosity.
      </h1>
      <p className="mt-6 text-subheading text-text-secondary">
        {succeeded
          ? 'Your gift to Amazing Grace Ministries is making ministry happen — from Sunday services to community outreach.'
          : 'Your payment is being processed. This page is safe to keep — your gift will complete shortly.'}
      </p>

      <dl className="mt-12 border border-border-subtle bg-surface-raised p-6 sm:p-8">
        <div className="flex items-baseline justify-between gap-4 pb-4">
          <dt className="text-text-secondary">{summary.isRecurring ? 'Each gift' : 'Gift amount'}</dt>
          <dd className="font-display text-heading font-medium text-text-primary">
            {formatUsd(summary.amountCents)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-border-subtle py-4">
          <dt className="text-text-secondary">Frequency</dt>
          <dd className="font-semibold text-text-primary">{summary.frequencyLabel}</dd>
        </div>
        {summary.fundLabel && (
          <div className="flex items-baseline justify-between gap-4 border-t border-border-subtle py-4">
            <dt className="text-text-secondary">Fund</dt>
            <dd className="font-semibold text-text-primary">{summary.fundLabel}</dd>
          </div>
        )}
        {summary.last4 && (
          <div className="flex items-baseline justify-between gap-4 border-t border-border-subtle py-4">
            <dt className="text-text-secondary">Card</dt>
            <dd className="font-semibold text-text-primary">•••• {summary.last4}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-4 border-t border-border-subtle pt-4">
          <dt className="text-text-secondary">Receipt</dt>
          <dd className="text-right font-semibold text-text-primary">
            {summary.receiptEmail
              ? `Emailed to ${summary.receiptEmail}`
              : 'No email receipt — save this page for your records'}
          </dd>
        </div>
      </dl>

      <p className="mt-8 text-body text-text-secondary">
        What happens next:{' '}
        {summary.isRecurring
          ? `your ${summary.frequencyLabel.toLowerCase()} gift will be processed automatically, and you can manage or cancel it at any time.`
          : 'your gift is put to work right away in the life of the church.'}
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Button href="/" size="lg">
          Back to home
        </Button>
        <Button href="/give" variant="secondary" size="lg">
          Give again
        </Button>
      </div>
      <p className="mt-6 text-caption text-text-muted">
        A donor portal at /account — where you will be able to view giving history and manage
        recurring gifts — is coming in Phase 2.
      </p>
    </div>
  )
}

function NotFound() {
  return (
    <div>
      <p className="eyebrow text-accent">Confirmation</p>
      <h1 className="mt-4 font-display text-display-md font-medium tracking-display">
        We could not find that gift.
      </h1>
      <p className="mt-6 text-subheading text-text-secondary">
        The confirmation link is missing or no longer valid. If you just gave, your payment may
        still have completed — check your email for a Stripe receipt, or contact us and we will
        gladly confirm.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Button href="/" size="lg">
          Back to home
        </Button>
        <Button href="/give" variant="secondary" size="lg">
          Go to giving
        </Button>
      </div>
    </div>
  )
}
