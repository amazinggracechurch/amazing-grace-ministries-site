import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CalendarDays, MapPin } from 'lucide-react'
import AnnouncementBar from '@/components/AnnouncementBar'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import Section from '@/components/layout/Section'
import Button from '@/components/ui/Button'
import Reveal from '@/components/ui/Reveal'
import RsvpForm from '@/components/events/RsvpForm'
import RsvpCheckout from '@/components/events/RsvpCheckout'
import { getEventBySlug, spotsLeft, type ChurchEvent } from '@/lib/events'
import {
  directionsUrl,
  formatEventDate,
  formatEventTimeRange,
} from '@/lib/dates'
import { site } from '@/lib/site'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function loadEvent(slug: string): Promise<ChurchEvent | null> {
  try {
    return await getEventBySlug(slug)
  } catch (error) {
    console.error('[events] failed to load event', {
      slug,
      message: error instanceof Error ? error.message : 'unknown',
    })
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const event = await loadEvent(slug)
  if (!event) {
    return { title: 'Event Not Found | Amazing Grace Ministries MN' }
  }
  const description =
    event.description.length > 160 ? `${event.description.slice(0, 157)}…` : event.description
  return {
    title: `${event.title} | Amazing Grace Ministries MN`,
    description,
    openGraph: {
      title: event.title,
      description,
      type: 'website',
      ...(event.flyerImage ? { images: [{ url: event.flyerImage }] } : {}),
    },
  }
}

function eventJsonLd(event: ChurchEvent) {
  const priced = event.priceCents !== null && event.priceCents > 0
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    startDate: event.startAt,
    ...(event.endAt ? { endDate: event.endAt } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    ...(event.flyerImage ? { image: [event.flyerImage] } : {}),
    location: {
      '@type': 'Place',
      name: event.location.name,
      address: event.location.address || site.address.street,
      ...(event.location.lat !== undefined && event.location.lng !== undefined
        ? {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: event.location.lat,
              longitude: event.location.lng,
            },
          }
        : {}),
    },
    organizer: {
      '@type': 'Organization',
      name: site.shortName,
      url: 'https://amazinggracemn.org',
    },
    ...(priced
      ? {
          offers: {
            '@type': 'Offer',
            price: (event.priceCents! / 100).toFixed(2),
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
  }
}

export default async function EventPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const query = await searchParams
  const event = await loadEvent(slug)
  if (!event) notFound()

  const priced = event.priceCents !== null && event.priceCents > 0
  const hasPassed = event.startAt < new Date().toISOString()
  const remaining = spotsLeft(event)
  const when = `${formatEventDate(event.startAt, event.timezone)} · ${formatEventTimeRange(
    event.startAt,
    event.endAt,
    event.timezone
  )} CT`
  const paidReturn = query.paid === '1'

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(eventJsonLd(event)).replace(/</g, '\\u003c'),
        }}
      />
      <Navbar />
      <AnnouncementBar />

      {event.flyerImage ? (
        <section className="relative isolate flex min-h-[60vh] items-end overflow-hidden bg-black">
          <Image
            src={event.flyerImage}
            alt={`${event.title} flyer`}
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/30 to-black/40"
          />
          <div className="mx-auto w-full max-w-7xl px-6 pt-40 pb-20">
            <Reveal>
              <p className="eyebrow text-white/70">Events / {when}</p>
              <h1 className="mt-4 max-w-4xl font-display text-display-lg font-light tracking-display text-white">
                {event.title}
              </h1>
            </Reveal>
          </div>
        </section>
      ) : (
        <section className="bg-surface-sunken">
          <div className="mx-auto w-full max-w-7xl px-6 pt-40 pb-20">
            <Reveal>
              <p className="eyebrow text-accent">Events</p>
              <h1 className="mt-4 max-w-4xl font-display text-display-lg font-light tracking-display text-text-primary">
                {event.title}
              </h1>
              <p className="mt-6 max-w-xl font-display text-heading italic text-text-secondary">
                {when}
              </p>
            </Reveal>
          </div>
        </section>
      )}

      <Section rhythm="normal">
        <div className="grid gap-12 lg:grid-cols-[1fr_24rem]">
          <div>
            {paidReturn && (
              <Reveal>
                <div className="mb-8 border border-border-subtle bg-surface-raised p-6">
                  <p className="font-display text-heading text-text-primary">
                    Payment received — thank you.
                  </p>
                  <p className="mt-2 text-body-sm text-text-secondary">
                    Your RSVP is being confirmed and a confirmation email is on its
                    way. If it doesn&rsquo;t arrive within a few minutes, contact us
                    at {site.contact.email}.
                  </p>
                </div>
              </Reveal>
            )}

            <Reveal>
              <dl className="grid grid-cols-1 gap-6 border-y border-border-subtle py-8 sm:grid-cols-3">
                <div>
                  <dt className="eyebrow text-text-muted">When</dt>
                  <dd className="mt-2 text-body-sm font-semibold text-text-primary">{when}</dd>
                </div>
                <div>
                  <dt className="eyebrow text-text-muted">Where</dt>
                  <dd className="mt-2 text-body-sm font-semibold text-text-primary">
                    {event.location.name}
                  </dd>
                  {event.location.address && (
                    <dd className="mt-1 text-caption text-text-muted">
                      {event.location.address}
                    </dd>
                  )}
                </div>
                <div>
                  <dt className="eyebrow text-text-muted">Cost</dt>
                  <dd className="mt-2 text-body-sm font-semibold text-text-primary">
                    {priced ? `$${(event.priceCents! / 100).toFixed(2)} per person` : 'Free'}
                  </dd>
                  {remaining !== null && (
                    <dd className="mt-1 text-caption text-text-muted">
                      {remaining > 0 ? `${remaining} spots left` : 'At capacity — waitlist open'}
                    </dd>
                  )}
                </div>
              </dl>
            </Reveal>

            <Reveal delay={1}>
              <div className="mt-10 max-w-2xl">
                <p className="text-body leading-relaxed text-text-secondary">
                  {event.description}
                </p>
                <div className="mt-8">
                  <Button
                    href={directionsUrl(event.location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="secondary"
                  >
                    <MapPin className="size-4" aria-hidden />
                    Get Directions
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>

          <aside>
            <Reveal delay={2}>
              {hasPassed ? (
                <div className="border border-border-subtle bg-surface-raised p-8">
                  <div className="flex size-12 items-center justify-center bg-accent-subtle text-accent">
                    <CalendarDays className="size-6" aria-hidden />
                  </div>
                  <h2 className="mt-4 font-display text-heading text-text-primary">
                    This event has passed
                  </h2>
                  <p className="mt-3 text-body-sm text-text-secondary">
                    Thanks to everyone who joined us. See what&rsquo;s coming up next
                    on the events page.
                  </p>
                  <div className="mt-6">
                    <Button href="/events" variant="secondary">
                      Upcoming Events
                    </Button>
                  </div>
                </div>
              ) : priced ? (
                <RsvpCheckout eventId={event.id} priceCents={event.priceCents!} />
              ) : (
                <RsvpForm
                  eventId={event.id}
                  eventTitle={event.title}
                  spotsLeft={remaining}
                />
              )}
            </Reveal>
          </aside>
        </div>
      </Section>

      <Footer />
    </main>
  )
}
