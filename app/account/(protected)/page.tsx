import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { HandHeart, HandCoins, Repeat, CalendarCheck, ArrowRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import ProgressBar from '@/components/ui/ProgressBar'
import SignOutButton from '@/components/auth/SignOutButton'
import { getSessionUser } from '@/lib/auth/session'
import {
  computeMemberYearGiving,
  getMemberDonations,
  getMemberProfile,
  getMemberRsvps,
  summarizeSubscriptions,
  type MemberRsvp,
} from '@/lib/account/member'
import { chicagoDateKey, formatChicagoDate } from '@/lib/admin/giving'
import { FUND_LABELS, FREQUENCY_LABELS, type Fund, type Frequency } from '@/lib/donations/shared'
import { getPledgesForUser, type Pledge } from '@/lib/pledges'
import { formatUsd } from '@/lib/money'
import { formatEventDate } from '@/lib/dates'

export const metadata: Metadata = {
  title: 'My Account | Amazing Grace Ministries MN',
  description: 'Your Amazing Grace Ministries member account.',
}

export const dynamic = 'force-dynamic'

function fundLabel(fund: string | null): string {
  return fund && fund in FUND_LABELS ? FUND_LABELS[fund as Fund] : (fund ?? 'General')
}

function frequencyLabel(frequency: string | null): string {
  return frequency && frequency in FREQUENCY_LABELS
    ? FREQUENCY_LABELS[frequency as Frequency]
    : (frequency ?? 'Recurring')
}

/**
 * The dashboard renders even when a backend read fails — a Firestore hiccup
 * must never lock a member out of their whole account. Each section degrades
 * to its empty state and the failure is logged.
 */
async function loadDashboard(uid: string, email: string | null) {
  const [profile, donations, rsvps, pledges] = await Promise.all([
    getMemberProfile(uid).catch(() => null),
    getMemberDonations(uid, email).catch((error: unknown) => {
      console.error('[account] dashboard donations failed', {
        message: error instanceof Error ? error.message : 'unknown',
      })
      return []
    }),
    getMemberRsvps(uid, email).catch((error: unknown) => {
      console.error('[account] dashboard rsvps failed', {
        message: error instanceof Error ? error.message : 'unknown',
      })
      return [] as MemberRsvp[]
    }),
    getPledgesForUser(uid).catch((error: unknown) => {
      console.error('[account] dashboard pledges failed', {
        message: error instanceof Error ? error.message : 'unknown',
      })
      return [] as Pledge[]
    }),
  ])
  return { profile, donations, rsvps, pledges }
}

const cardClasses = 'flex h-full flex-col gap-4 border border-border-subtle bg-surface-raised p-6 sm:p-8'

function CardHeading({ icon: Icon, label }: { icon: typeof HandCoins; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center bg-accent-subtle text-accent">
        <Icon className="size-5" aria-hidden />
      </span>
      <h2 className="eyebrow text-text-muted">{label}</h2>
    </div>
  )
}

export default async function AccountPage() {
  // The (protected) layout already enforced this; re-check so the page
  // never renders unauthenticated even if reused elsewhere.
  const user = await getSessionUser()
  if (!user) redirect('/account/signin?next=/account')

  const { profile, donations, rsvps, pledges } = await loadDashboard(user.uid, user.email)

  const name = profile?.displayName ?? user.name ?? 'Friend'
  const firstName = name.trim().split(/\s+/)[0] ?? 'Friend'
  const since = profile?.createdAt
    ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
        profile.createdAt
      )
    : null

  // (a) This year's giving, America/Chicago.
  const year = Number(chicagoDateKey(new Date().toISOString()).slice(0, 4))
  const giving = computeMemberYearGiving(donations, year)

  // (b) Active pledges with aggregate progress.
  const activePledges = pledges.filter((pledge) => pledge.status === 'active')
  const pledgedCents = activePledges.reduce((sum, pledge) => sum + pledge.amountCents, 0)
  const fulfilledCents = activePledges.reduce(
    (sum, pledge) => sum + pledge.fulfilledAmountCents,
    0
  )

  // (c) The member's live recurring gift, if any.
  const subscription =
    summarizeSubscriptions(donations).find(
      (sub) => sub.status === 'active' || sub.status === 'trialing'
    ) ?? null

  // (d) Upcoming RSVPs (confirmed or waitlist), soonest first.
  const nowIso = new Date().toISOString()
  const upcomingRsvps = rsvps
    .filter(
      ({ rsvp, event }) =>
        event !== null &&
        event.startAt >= nowIso &&
        (rsvp.status === 'confirmed' || rsvp.status === 'waitlist')
    )
    .sort((a, b) => a.event!.startAt.localeCompare(b.event!.startAt))
    .slice(0, 3)

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <section className="flex-1 pt-32 pb-24 md:pt-40">
        <div className="mx-auto max-w-7xl px-6">
          <p className="eyebrow text-text-muted">Member Portal</p>
          <div className="mt-6 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <Avatar
                src={user.photoURL ?? undefined}
                name={name}
                size="lg"
              />
              <div>
                <h1 className="font-display text-display-md font-light uppercase tracking-display text-text-primary">
                  Welcome, {firstName}
                  <span className="text-accent">.</span>
                </h1>
                <p className="mt-2 text-body-sm text-text-secondary">
                  {user.email}
                  {since && (
                    <span className="text-text-muted">
                      {' '}
                      · Member since {since}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <SignOutButton />
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {/* (a) Total given this year */}
            <article className={cardClasses}>
              <CardHeading icon={HandCoins} label={`Given in ${year}`} />
              {giving.giftCount === 0 ? (
                <>
                  <p className="text-body-sm text-text-secondary">
                    No gifts recorded yet this year. Every gift — large or small — helps the
                    ministry keep serving.
                  </p>
                  <div className="mt-auto pt-2">
                    <Link
                      href="/give"
                      className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-accent transition-colors duration-200 hover:text-accent-hover"
                    >
                      Make your first gift <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-display text-display-md font-light text-text-primary">
                    {formatUsd(giving.totalCents)}
                  </p>
                  <p className="text-body-sm text-text-secondary">
                    across {giving.giftCount} {giving.giftCount === 1 ? 'gift' : 'gifts'}
                    {giving.coveredFeeCents > 0 && (
                      <>
                        {' '}
                        · {formatUsd(giving.baseCents)} in gifts plus{' '}
                        {formatUsd(giving.coveredFeeCents)} of processing fees you covered
                      </>
                    )}
                  </p>
                  <div className="mt-auto pt-2">
                    <Link
                      href="/account/giving"
                      className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-accent transition-colors duration-200 hover:text-accent-hover"
                    >
                      Full giving history <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </div>
                </>
              )}
            </article>

            {/* (b) Active pledges — the kept "My Pledges" link card */}
            <Link href="/account/pledges" className="group block">
              <article
                className={`${cardClasses} transition-colors duration-200 group-hover:border-accent`}
              >
                <div className="flex items-center justify-between">
                  <CardHeading icon={HandHeart} label="My Pledges" />
                  {activePledges.length > 0 && (
                    <Badge variant="accent">
                      {activePledges.length} active
                    </Badge>
                  )}
                </div>
                {activePledges.length === 0 ? (
                  <p className="text-body-sm text-text-secondary">
                    No active pledges. Pledge toward a project and track your progress here.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="font-display text-display-md font-light text-text-primary">
                      {formatUsd(fulfilledCents)}
                      <span className="text-heading text-text-secondary">
                        {' '}
                        of {formatUsd(pledgedCents)}
                      </span>
                    </p>
                    <ProgressBar
                      value={fulfilledCents}
                      max={pledgedCents}
                      label={`${formatUsd(fulfilledCents)} fulfilled of ${formatUsd(pledgedCents)} pledged`}
                    />
                  </div>
                )}
                <div className="mt-auto pt-2">
                  <span className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-accent">
                    Track and fulfill pledges{' '}
                    <ArrowRight
                      className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </div>
              </article>
            </Link>

            {/* (c) Recurring gift */}
            <article className={cardClasses}>
              <CardHeading icon={Repeat} label="Recurring Gift" />
              {subscription === null ? (
                <>
                  <p className="text-body-sm text-text-secondary">
                    No recurring gift set up. A steady monthly gift is the single most helpful
                    way to support the ministry.
                  </p>
                  <div className="mt-auto pt-2">
                    <Link
                      href="/give"
                      className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-accent transition-colors duration-200 hover:text-accent-hover"
                    >
                      Start a recurring gift <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-display text-display-md font-light text-text-primary">
                    {formatUsd(subscription.amountCents)}
                    <span className="text-heading text-text-secondary">
                      {' '}
                      / {frequencyLabel(subscription.frequency).toLowerCase()}
                    </span>
                  </p>
                  <p className="text-body-sm text-text-secondary">
                    {fundLabel(subscription.fund)}
                  </p>
                  <div className="mt-auto pt-2">
                    <Link
                      href="/account/recurring"
                      className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-accent transition-colors duration-200 hover:text-accent-hover"
                    >
                      Manage recurring gifts <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </div>
                </>
              )}
            </article>

            {/* (d) Upcoming RSVPs */}
            <article className={cardClasses}>
              <CardHeading icon={CalendarCheck} label="Upcoming RSVPs" />
              {upcomingRsvps.length === 0 ? (
                <>
                  <p className="text-body-sm text-text-secondary">
                    Nothing on your calendar yet. Reserve a seat at an upcoming gathering.
                  </p>
                  <div className="mt-auto pt-2">
                    <Link
                      href="/events"
                      className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-accent transition-colors duration-200 hover:text-accent-hover"
                    >
                      Browse events <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <ul className="flex flex-col gap-3">
                    {upcomingRsvps.map(({ rsvp, event }) => (
                      <li
                        key={rsvp.id}
                        className="flex items-start justify-between gap-4 text-body-sm"
                      >
                        <div>
                          <p className="font-semibold text-text-primary">{event!.title}</p>
                          <p className="text-caption text-text-muted">
                            {formatEventDate(event!.startAt, event!.timezone)}
                            {rsvp.partySize > 1 && ` · party of ${rsvp.partySize}`}
                          </p>
                        </div>
                        <Badge variant={rsvp.status === 'confirmed' ? 'success' : 'warning'}>
                          {rsvp.status === 'confirmed' ? 'Confirmed' : 'Waitlist'}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-2">
                    <Link
                      href="/account/rsvps"
                      className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-accent transition-colors duration-200 hover:text-accent-hover"
                    >
                      All my RSVPs <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </div>
                </>
              )}
            </article>
          </div>

          <p className="mt-10 text-caption text-text-muted">
            Giving totals are church-local (America/Chicago) and include gifts made with this
            email before you signed in. Need a tax statement? Download it from your{' '}
            <Link href="/account/giving" className="font-semibold text-accent">
              giving history
            </Link>
            {donations.length > 0 && ` — your most recent gift was ${formatChicagoDate(donations[0]!.createdAt)}`}.
          </p>
        </div>
      </section>
      <Footer />
    </main>
  )
}
