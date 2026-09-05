import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Repeat } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import ManageBillingButton from '@/components/account/ManageBillingButton'
import { getSessionUser } from '@/lib/auth/session'
import {
  getMemberDonations,
  summarizeSubscriptions,
  type MemberDonation,
  type MemberSubscription,
} from '@/lib/account/member'
import { formatChicagoDate } from '@/lib/admin/giving'
import { FUND_LABELS, FREQUENCY_LABELS, type Fund, type Frequency } from '@/lib/donations/shared'
import { formatUsd } from '@/lib/money'

export const metadata: Metadata = {
  title: 'Recurring Gifts | Amazing Grace Ministries MN',
  description: 'Your recurring gifts and billing management.',
}

export const dynamic = 'force-dynamic'

function fundLabel(fund: string | null): string {
  return fund && fund in FUND_LABELS ? FUND_LABELS[fund as Fund] : (fund ?? 'General')
}

function frequencyLabel(frequency: string | null): string {
  return frequency && frequency in FREQUENCY_LABELS
    ? FREQUENCY_LABELS[frequency as Frequency]
    : 'Recurring'
}

function statusBadge(status: string): { label: string; variant: 'success' | 'warning' | 'neutral' } {
  if (status === 'active' || status === 'trialing') return { label: 'Active', variant: 'success' }
  if (status === 'past_due' || status === 'incomplete') return { label: 'Needs attention', variant: 'warning' }
  if (status === 'canceled' || status === 'cancelled') return { label: 'Cancelled', variant: 'neutral' }
  if (status === 'paused') return { label: 'Paused', variant: 'neutral' }
  return { label: status, variant: 'neutral' }
}

function SubscriptionCard({ subscription }: { subscription: MemberSubscription }) {
  const badge = statusBadge(subscription.status)
  return (
    <article className="flex flex-col gap-4 border border-border-subtle bg-surface-raised p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant={badge.variant}>{badge.label}</Badge>
          <h2 className="mt-3 font-display text-heading font-medium tracking-display text-text-primary">
            {fundLabel(subscription.fund)}
          </h2>
        </div>
        <p className="font-display text-heading font-medium text-text-primary">
          {formatUsd(subscription.amountCents)}
          <span className="text-body-sm font-normal text-text-secondary">
            {' '}
            / {frequencyLabel(subscription.frequency).toLowerCase()}
          </span>
        </p>
      </div>
      <p className="text-body-sm text-text-secondary">
        {subscription.giftCount} {subscription.giftCount === 1 ? 'gift' : 'gifts'} since{' '}
        {formatChicagoDate(subscription.firstGiftAt)} · most recent{' '}
        {formatChicagoDate(subscription.lastGiftAt)}
      </p>
    </article>
  )
}

export default async function RecurringPage() {
  // The (protected) layout already enforced this; re-check so the page
  // never renders unauthenticated even if reused elsewhere.
  const user = await getSessionUser()
  if (!user) redirect('/account/signin?next=/account/recurring')

  let donations: MemberDonation[] = []
  try {
    donations = await getMemberDonations(user.uid, user.email)
  } catch (error) {
    console.error('[account] recurring gifts failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
  }
  const subscriptions = summarizeSubscriptions(donations)

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <section className="flex-1 pt-32 pb-24 md:pt-40">
        <div className="mx-auto max-w-7xl px-6">
          <p className="eyebrow text-text-muted">Member Portal</p>
          <h1 className="mt-4 font-display text-display-md font-light uppercase tracking-display text-text-primary">
            Recurring Gifts
            <span className="text-accent">.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-body text-text-secondary">
            Your ongoing gifts, one per subscription. Update your card, pause, or cancel any
            time through Stripe&apos;s secure billing portal — your card details never touch
            this site.
          </p>

          <div className="mt-14">
            {subscriptions.length === 0 ? (
              <EmptyState
                icon={<Repeat className="size-6" aria-hidden />}
                title="No recurring gifts yet"
                body="A steady weekly or monthly gift is the single most helpful way to support the ministry — it lets us plan ahead with confidence."
                action={<Button href="/give">Start a recurring gift</Button>}
              />
            ) : (
              <div className="flex flex-col gap-6">
                {subscriptions.map((subscription) => (
                  <SubscriptionCard
                    key={subscription.subscriptionId}
                    subscription={subscription}
                  />
                ))}
                <div className="mt-2 flex flex-col gap-2">
                  <ManageBillingButton />
                  <p className="text-caption text-text-muted">
                    Opens Stripe&apos;s hosted billing portal in this tab. Update payment
                    methods, view invoices, or cancel a subscription there.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
