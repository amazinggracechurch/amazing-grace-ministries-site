import { Bell, CalendarDays, MessageCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Reveal from '@/components/ui/Reveal'
import { getSiteSettings } from '@/lib/site-settings'

/**
 * Closing CTA — a dark inverted band, the centered-statement moment of
 * the page (same inversion pattern as ServiceTimesBand on home).
 */
export default async function EventsCTA() {
  const settings = await getSiteSettings()
  return (
    <section className="dark bg-surface text-text-primary">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
        <Reveal>
          <p className="eyebrow text-accent">Don&apos;t Miss Out</p>
          <h2 className="mt-4 font-display text-display-md font-medium tracking-display">
            Stay in the Loop. <span className="italic text-accent">Always.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-subheading text-text-secondary">
            Never miss an event, announcement, or special gathering. Follow us on
            social media or reach out directly and we&apos;ll keep you connected.
          </p>
        </Reveal>
        <Reveal delay={1}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              href={settings.socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
            >
              <Bell className="size-4" aria-hidden />
              Follow Us
            </Button>
            <Button href="/contact" variant="secondary" size="lg">
              <MessageCircle className="size-4" aria-hidden />
              Contact Us
            </Button>
          </div>
        </Reveal>
        <Reveal delay={2}>
          <p className="mt-12 flex items-center justify-center gap-2 text-body-sm text-text-muted">
            <CalendarDays className="size-4" aria-hidden />
            5 events coming up this month
          </p>
        </Reveal>
      </div>
    </section>
  )
}
