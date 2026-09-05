import Link from 'next/link'
import { ArrowRight, CalendarDays } from 'lucide-react'
import Section from '@/components/layout/Section'
import SectionHeading from '@/components/layout/SectionHeading'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Reveal from '@/components/ui/Reveal'
import type { ChurchEvent } from '@/lib/events'
import {
  directionsUrl,
  eventDay,
  eventMonth,
  eventWeekday,
  formatEventDate,
  formatEventTimeRange,
} from '@/lib/dates'

/**
 * Live events list — typographic date cards (big Cormorant day numerals,
 * no fake artwork) fed from Firestore. The first upcoming event gets the
 * "Next Up" lead slot; everything else is a three-across grid linking to
 * /events/[slug]. Past events are dimmed but still browsable.
 *
 * Server component: the page reads Firestore and passes plain data down.
 * The events collection has no category field, so there are deliberately
 * no filter pills.
 */

function EventCard({ event, dimmed = false }: { event: ChurchEvent; dimmed?: boolean }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className={`group flex h-full flex-col border border-border-subtle bg-surface-raised p-6 transition-colors duration-200 hover:border-border-strong ${
        dimmed ? 'opacity-60 hover:opacity-100' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="font-display leading-none">
          <span className="block text-body-sm font-semibold tracking-[0.18em] text-text-muted">
            {eventMonth(event.startAt, event.timezone)}
          </span>
          <span className="mt-1 block text-display-md font-light text-text-primary">
            {eventDay(event.startAt, event.timezone)}
          </span>
        </p>
        {event.featured && <span className="eyebrow text-accent">Featured</span>}
      </div>
      <h3 className="mt-6 font-display text-heading text-text-primary">{event.title}</h3>
      <p className="mt-2 flex-1 text-body-sm text-text-secondary">{event.description}</p>
      <p className="mt-6 border-t border-border-subtle pt-4 text-caption text-text-muted">
        {formatEventDate(event.startAt, event.timezone)} ·{' '}
        {formatEventTimeRange(event.startAt, event.endAt, event.timezone)} ·{' '}
        {event.location.name}
      </p>
      <span className="mt-3 inline-flex items-center gap-1 self-start text-caption font-semibold text-accent">
        Details &amp; RSVP
        <ArrowRight
          className="size-3.5 transition-transform duration-200 group-hover:translate-x-1"
          aria-hidden
        />
      </span>
    </Link>
  )
}

export default function UpcomingEvents({
  upcoming,
  past,
}: {
  upcoming: ChurchEvent[]
  past: ChurchEvent[]
}) {
  const [nextUp, ...rest] = upcoming

  if (!nextUp && past.length === 0) {
    return (
      <Section rhythm="normal" id="upcoming">
        <Reveal>
          <SectionHeading eyebrow="Upcoming" title="All Events" />
        </Reveal>
        <Reveal delay={1} className="mt-12">
          <EmptyState
            icon={<CalendarDays className="size-6" aria-hidden />}
            title="Events are being planned."
            body="Check back soon — there is always something meaningful happening at Amazing Grace Ministries."
          />
        </Reveal>
      </Section>
    )
  }

  return (
    <>
      <Section rhythm="normal" id="upcoming">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="Upcoming" title="All Events" />
            <p className="mb-1 text-body-sm text-text-muted">
              {upcoming.length} upcoming {upcoming.length === 1 ? 'event' : 'events'}
            </p>
          </div>
        </Reveal>

        {nextUp && (
          <Reveal delay={1}>
            <article className="mt-12 grid border border-border-subtle bg-surface-raised md:grid-cols-[16rem_1fr]">
              <div className="flex items-center justify-center gap-3 border-b border-border-subtle bg-surface-sunken p-8 md:flex-col md:gap-0 md:border-r md:border-b-0">
                <span className="eyebrow text-text-muted">
                  {eventMonth(nextUp.startAt, nextUp.timezone)}
                </span>
                <span className="font-display text-display-lg font-light leading-none text-text-primary md:mt-2">
                  {eventDay(nextUp.startAt, nextUp.timezone)}
                </span>
                <span className="eyebrow text-text-muted md:mt-3">
                  {eventWeekday(nextUp.startAt, nextUp.timezone)}
                </span>
              </div>
              <div className="p-8 md:p-10">
                <p className="eyebrow text-accent">Next Up</p>
                <h3 className="mt-4 font-display text-display-md font-medium tracking-display text-text-primary">
                  {nextUp.title}
                </h3>
                <p className="mt-4 max-w-2xl text-body text-text-secondary">
                  {nextUp.description}
                </p>
                <dl className="mt-8 grid grid-cols-1 gap-4 border-t border-border-subtle pt-6 sm:grid-cols-3">
                  <div>
                    <dt className="eyebrow text-text-muted">Time</dt>
                    <dd className="mt-1 text-body-sm font-semibold text-text-primary">
                      {formatEventTimeRange(nextUp.startAt, nextUp.endAt, nextUp.timezone)}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-text-muted">Location</dt>
                    <dd className="mt-1 text-body-sm font-semibold text-text-primary">
                      {nextUp.location.name}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-text-muted">Open To</dt>
                    <dd className="mt-1 text-body-sm font-semibold text-text-primary">
                      Everyone
                    </dd>
                  </div>
                </dl>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Button href={`/events/${nextUp.slug}`}>
                    Details &amp; RSVP
                    <ArrowRight className="size-4" aria-hidden />
                  </Button>
                  <Button
                    href={directionsUrl(nextUp.location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="secondary"
                  >
                    Get Directions
                  </Button>
                </div>
              </div>
            </article>
          </Reveal>
        )}

        {rest.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((event, idx) => (
              <Reveal
                key={event.id}
                delay={Math.min(idx % 3, 4) as 0 | 1 | 2 | 3 | 4}
                className="h-full"
              >
                <EventCard event={event} />
              </Reveal>
            ))}
          </div>
        )}

        {!nextUp && (
          <Reveal delay={1} className="mt-12">
            <EmptyState
              icon={<CalendarDays className="size-6" aria-hidden />}
              title="No upcoming events right now."
              body="New gatherings are being planned — check back soon, or browse past events below."
            />
          </Reveal>
        )}
      </Section>

      {past.length > 0 && (
        <Section rhythm="dense" sunken id="past">
          <Reveal>
            <SectionHeading
              eyebrow="Looking Back"
              title="Past Events"
              lede="A record of what we've shared together."
            />
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {past.map((event, idx) => (
              <Reveal
                key={event.id}
                delay={Math.min(idx % 3, 4) as 0 | 1 | 2 | 3 | 4}
                className="h-full"
              >
                <EventCard event={event} dimmed />
              </Reveal>
            ))}
          </div>
        </Section>
      )}
    </>
  )
}
