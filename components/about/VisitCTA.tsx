import { MapPin, Play } from 'lucide-react'
import Button from '@/components/ui/Button'
import Reveal from '@/components/ui/Reveal'
import { getSiteSettings } from '@/lib/site-settings'

/**
 * Visit invitation — a compact dark band closing the page, with a Button
 * to /plan-your-visit. Copy preserved verbatim from the original VisitCTA.
 */
export default async function VisitCTA() {
  const settings = await getSiteSettings()
  return (
    <section className="dark bg-surface text-text-primary">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-10">
            <div className="max-w-2xl">
              <p className="eyebrow text-accent">Come As You Are</p>
              <h2 className="mt-4 font-display text-display-md font-medium tracking-display text-text-primary">
                Ready to Experience <span className="italic text-accent">Amazing Grace?</span>
              </h2>
              <p className="mt-5 text-body text-text-secondary">
                Whether it&rsquo;s your first time or you&rsquo;re coming back after a long time away
                &mdash; you are welcome here. We believe in transparency and honesty, and we will
                work with you to ensure our community is the right fit for you.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button href="/plan-your-visit" size="lg">
                <MapPin className="size-4" aria-hidden />
                Plan Your Visit
              </Button>
              <Button
                href={settings.socials.youtube}
                variant="secondary"
                size="lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Play className="size-4" aria-hidden />
                Watch Online
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
