'use client'
import { useState } from 'react'
import { ArrowRight, CalendarDays } from 'lucide-react'
import Section from '@/components/layout/Section'
import SectionHeading from '@/components/layout/SectionHeading'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Reveal from '@/components/ui/Reveal'
import { site } from '@/lib/site'

type EventCategory = 'All' | 'Community' | 'Youth' | 'Worship' | 'Special'

type ChurchEvent = {
  id: number
  title: string
  category: Exclude<EventCategory, 'All'>
  date: string
  month: string
  day: string
  time: string
  location: string
  description: string
}

/**
 * The events the site already lists. Until events move to Firestore
 * these stay an honest typographic treatment — big Cormorant date
 * numerals, no fake flyer artwork.
 */
const events: ChurchEvent[] = [
  {
    id: 1,
    title: 'Open Heavens',
    category: 'Special',
    date: 'June 7, 2025',
    month: 'JUN',
    day: '07',
    time: '09:00 AM',
    location: 'Main Sanctuary',
    description:
      'Start the month with a supercharge of prayer. Set your mind in tune with God in our monthly corporate prayer gathering.',
  },
  {
    id: 2,
    title: 'Community Night',
    category: 'Community',
    date: 'June 15, 2025',
    month: 'JUN',
    day: '15',
    time: '6:00 PM',
    location: 'Fellowship Hall',
    description:
      'An evening of worship, connection, and community. Come meet new friends and deepen existing relationships in the Amazing Family.',
  },
  {
    id: 3,
    title: 'Monday Bible Study',
    category: 'Community',
    date: 'June 16, 2025',
    month: 'JUN',
    day: '16',
    time: 'Audio Conference',
    location: '470-480-9523 · Code: 198407',
    description:
      'Digging For Hidden Treasures — study to shew ourselves approved as workmen rightly dividing the word of truth.',
  },
  {
    id: 4,
    title: 'Hour of Battle',
    category: 'Worship',
    date: 'June 18, 2025',
    month: 'JUN',
    day: '18',
    time: 'Audio Conference',
    location: '470-480-9523 · Code: 198407',
    description:
      'Our weekly midweek prayer service. We gather to pray fervently until something happens.',
  },
  {
    id: 5,
    title: 'Sunday Celebration',
    category: 'Worship',
    date: 'June 22, 2025',
    month: 'JUN',
    day: '22',
    time: '09:00 AM',
    location: 'Sanctuary',
    description:
      'Join our weekly family gathering — Spirit-filled worship, powerful teaching from Pastor Uchegbu, and real community.',
  },
  {
    id: 6,
    title: 'Open Heavens',
    category: 'Special',
    date: 'July 5, 2025',
    month: 'JUL',
    day: '05',
    time: '09:00 AM',
    location: 'Main Sanctuary',
    description:
      'Our monthly corporate prayer gathering. Start July with a supercharge of prayer and seek God together as a church family.',
  },
]

const categories: EventCategory[] = ['All', 'Community', 'Youth', 'Worship', 'Special']

const ADD_TO_CALENDAR_URL =
  'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Open+Heavens+Amazing+Grace+Ministries+MN&dates=20250607T100000/20250607T120000&details=Start+the+month+with+a+supercharge+of+prayer.+Open+Heavens+is+our+monthly+corporate+prayer+gathering+where+we+come+together+as+the+Amazing+Family+to+seek+God,+pray+fervently,+and+set+our+minds+in+tune+with+Him.&location=715+Edgerton+Street,+Saint+Paul,+MN+55130'

export default function UpcomingEvents() {
  const [activeCategory, setActiveCategory] = useState<EventCategory>('All')

  const filtered = events.filter(
    (e) => activeCategory === 'All' || e.category === activeCategory
  )

  return (
    <Section rhythm="normal" id="upcoming">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="Upcoming" title="All Events" />
          <p className="mb-1 text-body-sm text-text-muted">
            Showing {filtered.length} events
          </p>
        </div>
      </Reveal>

      {/* Next Up — the highlighted gathering, given the lead slot */}
      <Reveal delay={1}>
        <article className="mt-12 grid border border-border-subtle bg-surface-raised md:grid-cols-[16rem_1fr]">
          <div className="flex items-center justify-center gap-3 border-b border-border-subtle bg-surface-sunken p-8 md:flex-col md:gap-0 md:border-r md:border-b-0">
            <span className="eyebrow text-text-muted">JUN</span>
            <span className="font-display text-display-lg font-light leading-none text-text-primary md:mt-2">
              07
            </span>
            <span className="eyebrow text-text-muted md:mt-3">Saturday</span>
          </div>
          <div className="p-8 md:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <p className="eyebrow text-accent">Next Up</p>
              <span className="bg-accent-subtle px-2.5 py-0.5 text-caption font-semibold text-accent">
                Special Event
              </span>
            </div>
            <h3 className="mt-4 font-display text-display-md font-medium tracking-display text-text-primary">
              Open Heavens
            </h3>
            <p className="mt-4 max-w-2xl text-body text-text-secondary">
              Start the month with a supercharge of prayer. Open Heavens is our
              monthly corporate prayer gathering where we come together as the
              Amazing Family to seek God, pray fervently, and set our minds in
              tune with Him. No registration required.
            </p>
            <dl className="mt-8 grid grid-cols-1 gap-4 border-t border-border-subtle pt-6 sm:grid-cols-3">
              <div>
                <dt className="eyebrow text-text-muted">Time</dt>
                <dd className="mt-1 text-body-sm font-semibold text-text-primary">09:00 AM</dd>
              </div>
              <div>
                <dt className="eyebrow text-text-muted">Location</dt>
                <dd className="mt-1 text-body-sm font-semibold text-text-primary">Main Sanctuary</dd>
              </div>
              <div>
                <dt className="eyebrow text-text-muted">Open To</dt>
                <dd className="mt-1 text-body-sm font-semibold text-text-primary">Everyone</dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button href={ADD_TO_CALENDAR_URL} target="_blank" rel="noopener noreferrer">
                <CalendarDays className="size-4" aria-hidden />
                Add to Calendar
              </Button>
              <Button
                href={site.address.mapsUrl}
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

      {/* Category filter */}
      <Reveal delay={1}>
        <div className="mt-12 flex flex-wrap gap-2" role="group" aria-label="Filter events by category">
          {categories.map((cat) => {
            const isActive = activeCategory === cat
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveCategory(cat)}
                className={
                  isActive
                    ? 'cursor-pointer bg-accent px-4 py-2 text-body-sm font-semibold text-on-accent transition-colors duration-200'
                    : 'cursor-pointer border border-border-strong px-4 py-2 text-body-sm font-semibold text-text-secondary transition-colors duration-200 hover:border-accent hover:text-accent'
                }
              >
                {cat}
              </button>
            )
          })}
        </div>
      </Reveal>

      {filtered.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event, idx) => (
            <Reveal key={event.id} delay={Math.min(idx % 3, 4) as 0 | 1 | 2 | 3 | 4} className="h-full">
              <article className="flex h-full flex-col border border-border-subtle bg-surface-raised p-6 transition-colors duration-200 hover:border-border-strong">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-display leading-none">
                    <span className="block text-body-sm font-semibold tracking-[0.18em] text-text-muted">
                      {event.month}
                    </span>
                    <span className="mt-1 block text-display-md font-light text-text-primary">
                      {event.day}
                    </span>
                  </p>
                  <span className="eyebrow text-accent">{event.category}</span>
                </div>
                <h3 className="mt-6 font-display text-heading text-text-primary">{event.title}</h3>
                <p className="mt-2 flex-1 text-body-sm text-text-secondary">{event.description}</p>
                <p className="mt-6 border-t border-border-subtle pt-4 text-caption text-text-muted">
                  {event.date} · {event.time} · {event.location}
                </p>
                <a
                  href={site.address.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-3 inline-flex items-center gap-1 self-start text-caption font-semibold text-accent"
                >
                  Details
                  <ArrowRight
                    className="size-3.5 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden
                  />
                </a>
              </article>
            </Reveal>
          ))}
        </div>
      ) : (
        <Reveal className="mt-8">
          <EmptyState
            icon={<CalendarDays className="size-6" aria-hidden />}
            title="No events found."
            body="Check back soon or browse all categories."
          />
        </Reveal>
      )}
    </Section>
  )
}
