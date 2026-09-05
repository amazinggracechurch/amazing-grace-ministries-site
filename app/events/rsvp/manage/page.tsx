import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarX, TriangleAlert } from 'lucide-react'
import AnnouncementBar from '@/components/AnnouncementBar'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import Section from '@/components/layout/Section'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Reveal from '@/components/ui/Reveal'
import CancelRsvpButton from '@/components/events/CancelRsvpButton'
import { getEventById, getRsvpById, type ChurchEvent, type Rsvp } from '@/lib/events'
import { verifyRsvpToken } from '@/lib/tokens'
import { formatEventDate, formatEventTimeRange } from '@/lib/dates'
import { fullName } from '@/lib/names'

export const metadata: Metadata = {
  title: 'Manage Your RSVP | Amazing Grace Ministries MN',
  description: 'Review or cancel your RSVP for an Amazing Grace Ministries event.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function InvalidLinkState() {
  return (
    <Section rhythm="loose">
      <Reveal>
        <div className="mx-auto max-w-xl border border-border-subtle bg-surface-raised p-8 text-left">
          <div className="flex size-12 items-center justify-center bg-accent-subtle text-accent">
            <TriangleAlert className="size-6" aria-hidden />
          </div>
          <h1 className="mt-4 font-display text-display-md font-medium tracking-display text-text-primary">
            This link isn&rsquo;t valid
          </h1>
          <p className="mt-4 text-body text-text-secondary">
            The manage link may have been mistyped or truncated. The full link is in
            your RSVP confirmation email — try copying it again, or contact us and
            we&rsquo;ll sort it out together.
          </p>
          <div className="mt-8">
            <Button href="/events" variant="secondary">
              Upcoming Events
            </Button>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}

function StatusBadge({ status }: { status: Rsvp['status'] }) {
  if (status === 'confirmed') return <Badge variant="success">Confirmed</Badge>
  if (status === 'waitlist') return <Badge variant="warning">Waitlist</Badge>
  return <Badge variant="neutral">Cancelled</Badge>
}

export default async function ManageRsvpPage({ searchParams }: PageProps) {
  const query = await searchParams
  const id = typeof query.id === 'string' ? query.id : ''
  const token = typeof query.token === 'string' ? query.token : ''

  const tokenValid = id.length > 0 && token.length > 0 && verifyRsvpToken(id, token)

  let rsvp: Rsvp | null = null
  let event: ChurchEvent | null = null
  if (tokenValid) {
    try {
      rsvp = await getRsvpById(id)
      if (rsvp) event = await getEventById(rsvp.eventId)
    } catch (error) {
      console.error('[rsvp manage] lookup failed', {
        message: error instanceof Error ? error.message : 'unknown',
      })
    }
  }

  if (!tokenValid || !rsvp) {
    return (
      <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
        <Navbar />
        <AnnouncementBar />
        <InvalidLinkState />
        <Footer />
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <AnnouncementBar />

      <Section rhythm="loose">
        <Reveal>
          <div className="max-w-2xl">
            <p className="eyebrow text-accent">Manage Your RSVP</p>
            <h1 className="mt-4 font-display text-display-md font-medium tracking-display text-text-primary">
              {event?.title ?? 'Your RSVP'}
            </h1>
            {rsvp.status === 'cancelled' ? (
              <div className="mt-8 border border-border-subtle bg-surface-raised p-8">
                <div className="flex size-12 items-center justify-center bg-accent-subtle text-accent">
                  <CalendarX className="size-6" aria-hidden />
                </div>
                <h2 className="mt-4 font-display text-heading text-text-primary">
                  This RSVP was cancelled
                </h2>
                <p className="mt-3 text-body-sm text-text-secondary">
                  Nothing more to do here. Changed your mind? You can RSVP again
                  from the event page.
                </p>
                <div className="mt-6">
                  <Button href="/events" variant="secondary">
                    Upcoming Events
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <dl className="mt-8 grid grid-cols-1 gap-6 border-y border-border-subtle py-8 sm:grid-cols-2">
                  <div>
                    <dt className="eyebrow text-text-muted">Name</dt>
                    <dd className="mt-2 text-body-sm font-semibold text-text-primary">
                      {fullName(rsvp.firstName, rsvp.lastName) || rsvp.name}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-text-muted">Status</dt>
                    <dd className="mt-2">
                      <StatusBadge status={rsvp.status} />
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-text-muted">When</dt>
                    <dd className="mt-2 text-body-sm font-semibold text-text-primary">
                      {event
                        ? `${formatEventDate(event.startAt, event.timezone)} · ${formatEventTimeRange(event.startAt, event.endAt, event.timezone)} CT`
                        : 'See your confirmation email'}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-text-muted">Party Size</dt>
                    <dd className="mt-2 text-body-sm font-semibold text-text-primary">
                      {rsvp.partySize}
                    </dd>
                  </div>
                </dl>
                {event && (
                  <p className="mt-4 text-body-sm text-text-muted">
                    <Link
                      href={`/events/${event.slug}`}
                      className="font-semibold text-accent underline-offset-4 hover:underline"
                    >
                      View event details
                    </Link>
                  </p>
                )}
                <div className="mt-8">
                  <CancelRsvpButton id={rsvp.id} token={token} />
                </div>
              </>
            )}
          </div>
        </Reveal>
      </Section>

      <Footer />
    </main>
  )
}
