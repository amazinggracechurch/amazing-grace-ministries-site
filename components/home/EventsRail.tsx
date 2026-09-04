import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Section from '@/components/layout/Section'
import ScrollRail from '@/components/layout/ScrollRail'
import SectionHeading from '@/components/layout/SectionHeading'
import Reveal from '@/components/ui/Reveal'

/**
 * The three events the site already lists. Until events move to
 * Firestore (6.5), these stay an honest typographic treatment —
 * no fake flyer artwork.
 */
const events = [
  {
    month: 'APR',
    day: '26',
    category: 'Community',
    title: 'Community Groups',
    description: 'Build authentic faith friendships in our weekly small groups.',
    time: 'April 26 – June 6',
    location: 'Online & In Person',
  },
  {
    month: 'MAY',
    day: '08',
    category: 'Special',
    title: 'Open Heavens',
    description: 'Start the month with a supercharge of prayer. Set your mind in tune with God.',
    time: '1st Saturday of Month',
    location: 'Main Sanctuary',
  },
  {
    month: 'MAY',
    day: '10',
    category: 'Worship',
    title: 'Sunday Celebration',
    description: 'Join our weekly family gathering — all are welcome. In person and online.',
    time: '09:00 AM Sunday',
    location: 'Sanctuary',
  },
]

export default function EventsRail() {
  return (
    <Section rhythm="normal" sunken>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="What's Happening"
          title="Upcoming at the church"
          lede="Stay connected and grow with us. Find upcoming classes, gatherings, and special services here."
        />
        <Link
          href="/events"
          className="group mb-1 inline-flex items-center gap-2 text-body font-semibold text-accent"
        >
          See more events
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
        </Link>
      </div>

      <Reveal className="mt-12">
        <ScrollRail label="Upcoming events">
          {events.map((event) => (
            <article
              key={event.title}
              className="flex w-80 flex-col border border-border-subtle bg-surface-raised p-6"
            >
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
                {event.time} · {event.location}
              </p>
            </article>
          ))}
        </ScrollRail>
      </Reveal>
    </Section>
  )
}
