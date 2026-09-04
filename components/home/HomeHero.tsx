import Image from 'next/image'
import Link from 'next/link'
import { Play } from 'lucide-react'
import Button from '@/components/ui/Button'
import Reveal from '@/components/ui/Reveal'
import { site } from '@/lib/site'

/**
 * Full-bleed photographic hero. One headline, one primary CTA, one
 * secondary. The ken-burns drift is the page's single continuous
 * animation; the overlay exists only for legibility.
 */
export default function HomeHero() {
  return (
    <section className="relative isolate flex min-h-svh items-end overflow-hidden bg-black">
      <Image
        src="/images/img1.jpg"
        alt="The congregation of Amazing Grace Ministries worshipping with raised hands"
        fill
        priority
        sizes="100vw"
        className="ken-burns -z-10 object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/30 to-black/40"
      />

      <div className="mx-auto w-full max-w-7xl px-6 pt-40 pb-24 md:pb-32">
        <Reveal>
          <p className="eyebrow text-white/70">Welcome to</p>
          <h1 className="mt-4 max-w-4xl font-display text-display-xl font-light tracking-display uppercase text-white">
            Amazing Grace Ministries
          </h1>
        </Reveal>
        <Reveal delay={1}>
          <p className="mt-6 max-w-xl font-display text-heading italic text-white/85">
            &ldquo;{site.heroVerse.text}&rdquo;
            <span className="ml-3 align-middle font-body text-body-sm not-italic tracking-wide text-white/60">
              — {site.heroVerse.reference}
            </span>
          </p>
        </Reveal>
        <Reveal delay={2}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button href="/plan-your-visit" size="lg">
              Plan Your Visit
            </Button>
            <Link
              href={site.socials.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/60 px-6 py-3 text-subheading font-semibold text-white transition-colors duration-200 hover:border-white hover:bg-white/10"
            >
              <Play className="size-4" aria-hidden />
              Watch Online
            </Link>
          </div>
        </Reveal>
        <Reveal delay={3}>
          <p className="mt-10 text-body-sm font-semibold tracking-wide text-white/70">
            Sundays 10:00 AM · {site.address.street}, {site.address.city}, {site.address.state}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
