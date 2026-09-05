import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CalendarCheck, MapPin } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { getSessionUser } from '@/lib/auth/session'
import { getMemberRsvps, type MemberRsvp } from '@/lib/account/member'
import type { RsvpStatus } from '@/lib/events'
import { formatEventDate } from '@/lib/dates'

export const metadata: Metadata = {
  title: 'My RSVPs | Amazing Grace Ministries MN',
  description: 'Events you have reserved a seat for.',
}

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<RsvpStatus, string> = {
  confirmed: 'Confirmed',
  waitlist: 'Waitlist',
  cancelled: 'Cancelled',
}

function statusVariant(status: RsvpStatus): 'success' | 'warning' | 'neutral' {
  if (status === 'confirmed') return 'success'
  if (status === 'waitlist') return 'warning'
  return 'neutral'
}

function RsvpCard({ entry, upcoming }: { entry: MemberRsvp; upcoming: boolean }) {
  const { rsvp, event } = entry
  return (
    <article className="flex flex-col gap-4 border border-border-subtle bg-surface-raised p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant={statusVariant(rsvp.status)}>{STATUS_LABEL[rsvp.status]}</Badge>
          <h3 className="mt-3 font-display text-heading font-medium tracking-display text-text-primary">
            {event ? (
              <Link
                href={`/events/${event.slug}`}
                className="transition-colors duration-200 hover:text-accent"
              >
                {event.title}
              </Link>
            ) : (
              'Event no longer available'
            )}
          </h3>
        </div>
        <p className="text-body-sm text-text-secondary">
          {rsvp.partySize === 1 ? '1 seat' : `${rsvp.partySize} seats`}
        </p>
      </div>

      {event && (
        <div className="flex flex-col gap-1 text-body-sm text-text-secondary">
          <p>{formatEventDate(event.startAt, event.timezone)}</p>
          {event.location.name && (
            <p className="inline-flex items-center gap-1.5 text-text-muted">
              <MapPin className="size-4" aria-hidden />
              {event.location.name}
            </p>
          )}
        </div>
      )}
      {!event && (
        <p className="text-body-sm text-text-muted">
          Reserved as {rsvp.name || rsvp.email || 'guest'} · this event has been removed.
        </p>
      )}

      {upcoming && rsvp.status !== 'cancelled' && (
        <div className="mt-1">
          <Button
            href={`/events/rsvp/manage?id=${encodeURIComponent(rsvp.id)}&token=${encodeURIComponent(rsvp.manageToken)}`}
            variant="secondary"
            size="sm"
          >
            Manage RSVP
          </Button>
        </div>
      )}
    </article>
  )
}

export default async function RsvpsPage() {
  // The (protected) layout already enforced this; re-check so the page
  // never renders unauthenticated even if reused elsewhere.
  const user = await getSessionUser()
  if (!user) redirect('/account/signin?next=/account/rsvps')

  let entries: MemberRsvp[] = []
  try {
    entries = await getMemberRsvps(user.uid, user.email)
  } catch (error) {
    console.error('[account] rsvps failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
  }

  const nowIso = new Date().toISOString()
  const upcoming = entries
    .filter(({ event }) => event !== null && event.startAt >= nowIso)
    .sort((a, b) => a.event!.startAt.localeCompare(b.event!.startAt))
  const past = entries
    .filter(({ event }) => event === null || event.startAt < nowIso)
    .sort((a, b) => (b.event?.startAt ?? '').localeCompare(a.event?.startAt ?? ''))

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <section className="flex-1 pt-32 pb-24 md:pt-40">
        <div className="mx-auto max-w-7xl px-6">
          <p className="eyebrow text-text-muted">Member Portal</p>
          <h1 className="mt-4 font-display text-display-md font-light uppercase tracking-display text-text-primary">
            My RSVPs
            <span className="text-accent">.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-body text-text-secondary">
            Seats you have reserved — including guest RSVPs made with this email before you
            signed in.
          </p>

          <div className="mt-14">
            {entries.length === 0 ? (
              <EmptyState
                icon={<CalendarCheck className="size-6" aria-hidden />}
                title="No RSVPs yet"
                body="When you reserve a seat at an event, it will show up here so you can find the details and manage your booking."
                action={<Button href="/events">Browse events</Button>}
              />
            ) : (
              <div className="flex flex-col gap-14">
                <section>
                  <h2 className="eyebrow text-text-muted">Upcoming</h2>
                  {upcoming.length === 0 ? (
                    <p className="mt-4 text-body-sm text-text-secondary">
                      Nothing coming up.{' '}
                      <Link
                        href="/events"
                        className="font-semibold text-accent transition-colors duration-200 hover:text-accent-hover"
                      >
                        See what&apos;s on
                      </Link>
                      .
                    </p>
                  ) : (
                    <div className="mt-6 flex flex-col gap-6">
                      {upcoming.map((entry) => (
                        <RsvpCard key={entry.rsvp.id} entry={entry} upcoming />
                      ))}
                    </div>
                  )}
                </section>

                {past.length > 0 && (
                  <section>
                    <h2 className="eyebrow text-text-muted">Past</h2>
                    <div className="mt-6 flex flex-col gap-6">
                      {past.map((entry) => (
                        <RsvpCard key={entry.rsvp.id} entry={entry} upcoming={false} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
