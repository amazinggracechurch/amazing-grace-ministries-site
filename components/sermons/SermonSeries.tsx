import { ArrowRight } from 'lucide-react'
import Section from '@/components/layout/Section'
import ScrollRail from '@/components/layout/ScrollRail'
import SectionHeading from '@/components/layout/SectionHeading'
import Reveal from '@/components/ui/Reveal'

/**
 * Sermon series as a horizontal rail of typographic cards — no fake artwork,
 * the series names carry the design. Dark band for page contrast. Until
 * sermons move to a data layer, the array stays here.
 */
const sermonSeries = [
  {
    id: 1,
    title: 'Living in the Promise',
    description: 'A powerful series on stepping into everything God has prepared for you.',
    sermonCount: 6,
    date: 'Apr – May 2025',
  },
  {
    id: 2,
    title: 'Rooted',
    description: 'Building an unshakeable foundation in the Word of God.',
    sermonCount: 4,
    date: 'Feb – Mar 2025',
  },
  {
    id: 3,
    title: 'Grace Upon Grace',
    description: 'Exploring the depths of God\'s unending grace in our everyday lives.',
    sermonCount: 5,
    date: 'Jan 2025',
  },
]

export default function SermonSeries() {
  return (
    <div className="dark bg-surface text-text-primary">
      <Section rhythm="normal">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="Browse by Series" title="Sermon Series" />
          <a
            href="#browser"
            className="group mb-1 inline-flex items-center gap-2 text-body font-semibold text-accent"
          >
            View All
            <ArrowRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden
            />
          </a>
        </div>

        <Reveal className="mt-12">
          <ScrollRail label="Sermon series">
            {sermonSeries.map((series) => (
              <a
                key={series.id}
                href="#browser"
                className="group flex w-80 flex-col border border-border-subtle bg-surface-raised p-6 transition-colors duration-200 hover:border-accent"
              >
                <h3 className="font-display text-display-md font-light tracking-display text-text-primary">
                  {series.title}
                </h3>
                <p className="mt-3 flex-1 text-body-sm text-text-secondary">{series.description}</p>
                <p className="mt-6 border-t border-border-subtle pt-4 text-caption text-text-muted">
                  {series.sermonCount} Messages &middot; {series.date}
                </p>
              </a>
            ))}
          </ScrollRail>
        </Reveal>
      </Section>
    </div>
  )
}
