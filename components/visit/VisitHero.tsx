import Image from 'next/image'
import Reveal from '@/components/ui/Reveal'
import { getSiteSettings } from '@/lib/site-settings'

/**
 * Full-bleed photographic hero. The headline, welcome line, and the
 * practical fact line (when + where) answer the highest-intent
 * visitor's first questions without scrolling.
 */
export default async function VisitHero() {
  const settings = await getSiteSettings()
  const sunday = settings.services[0]

  return (
    <section className="relative isolate flex min-h-[80vh] items-end overflow-hidden bg-black">
      <Image
        src="/images/community-choir.jpg"
        alt="The choir of Amazing Grace Ministries leading the congregation in song"
        fill
        priority
        sizes="100vw"
        className="ken-burns -z-10 object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/40 to-black/30"
      />

      <div className="mx-auto w-full max-w-7xl px-6 pt-40 pb-20 md:pb-28">
        <Reveal>
          <p className="eyebrow text-white/70">Home / Plan Your Visit</p>
          <h1 className="mt-4 max-w-4xl font-display text-display-xl font-light uppercase tracking-display text-white">
            We&rsquo;ve Been{' '}
            <span className="italic normal-case">Expecting You.</span>
          </h1>
        </Reveal>
        <Reveal delay={1}>
          <p className="mt-6 max-w-xl font-display text-heading italic text-white/85">
            &ldquo;Come as you are. You are welcome here.&rdquo;
          </p>
        </Reveal>
        <Reveal delay={2}>
          <p className="mt-10 text-body-sm font-semibold tracking-wide text-white/70">
            {sunday.day} {sunday.time} &middot; {settings.address.street}, {settings.address.city}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
