import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import Reveal from '@/components/ui/Reveal'
import { site } from '@/lib/site'

const ways = [
  {
    label: 'Visit In Person',
    lines: ['Sundays at 09:00 AM', 'Main Sanctuary'],
    action: { text: 'Get Directions', href: site.address.mapsUrl, external: true },
  },
  {
    label: 'Watch Online',
    lines: ['Live every Sunday at 09:00 AM', 'Available online'],
    action: { text: 'Watch Live', href: site.socials.youtube, external: true },
  },
  {
    label: 'Join by Phone',
    lines: ['470-480-9523 or 425-436-6364', 'Access Code: 198407'],
    action: { text: 'Dial In', href: 'tel:4704809523', external: false },
  },
]

/**
 * Closing CTA — a dark centered statement band with the three ways to
 * join, each one typographic rather than an icon card.
 */
export default function VisitContactCTA() {
  return (
    <section aria-labelledby="visit-cta-heading" className="dark bg-surface text-text-primary">
      <div className="mx-auto max-w-7xl px-6 py-24 text-center md:py-32">
        <Reveal>
          <p className="eyebrow text-accent">We&rsquo;d Love to Meet You</p>
          <h2
            id="visit-cta-heading"
            className="mx-auto mt-4 max-w-2xl font-display text-display-lg font-medium tracking-display"
          >
            See You This Sunday.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-subheading text-text-secondary">
            Whether you show up in person or tune in online — there&rsquo;s a seat
            with your name on it at Amazing Grace Ministries MN.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-10 border-t border-border-subtle pt-12 sm:grid-cols-3">
          {ways.map((way, i) => (
            <Reveal key={way.label} delay={Math.min(i + 1, 4) as 0 | 1 | 2 | 3 | 4}>
              <p className="eyebrow text-text-muted">{way.label}</p>
              <p className="mt-3 font-display text-heading font-medium">{way.lines[0]}</p>
              <p className="mt-1 text-body-sm text-text-secondary">{way.lines[1]}</p>
              <div className="mt-5">
                <Button
                  href={way.action.href}
                  variant="secondary"
                  size="sm"
                  className="group"
                  {...(way.action.external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                >
                  {way.action.text}
                  <ArrowUpRight
                    aria-hidden
                    className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </Button>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={2}>
          <p className="mt-14 flex flex-wrap items-center justify-center gap-2 text-body-sm text-text-secondary">
            Still have questions?
            <Button href="/contact" variant="link" size="sm" className="group">
              Contact Us
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Button>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
