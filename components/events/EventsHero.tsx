import Image from 'next/image'
import { CalendarDays } from 'lucide-react'
import Reveal from '@/components/ui/Reveal'

/**
 * Events hero — full-bleed stage photograph, single ken-burns drift.
 * Same overlaid-type language as the home hero, one static image.
 */
export default function EventsHero() {
  return (
    <section className="relative isolate flex min-h-[70vh] items-end overflow-hidden bg-black">
      <Image
        src="/images/hero-stage.jpg"
        alt="Women of the church leading worship from the stage"
        fill
        priority
        sizes="100vw"
        className="ken-burns -z-10 object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/30 to-black/40"
      />

      <div className="mx-auto w-full max-w-7xl px-6 pt-40 pb-24">
        <Reveal>
          <p className="eyebrow text-white/70">Home / Events</p>
          <h1 className="mt-4 max-w-4xl font-display text-display-lg font-light uppercase tracking-display text-white">
            Something
            <span className="block normal-case italic">Always Happening.</span>
          </h1>
        </Reveal>
        <Reveal delay={1}>
          <p className="mt-6 max-w-xl font-display text-heading italic text-white/85">
            &ldquo;There is always a place for you here.&rdquo;
          </p>
        </Reveal>
        <Reveal delay={2}>
          <div className="mt-10">
            <a
              href="#upcoming"
              className="inline-flex items-center gap-2 bg-accent px-6 py-3 text-subheading font-semibold text-on-accent transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-hover"
            >
              <CalendarDays className="size-4" aria-hidden />
              View All Events
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
