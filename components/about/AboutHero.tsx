import FullBleed from '@/components/layout/FullBleed'
import Reveal from '@/components/ui/Reveal'
import { site } from '@/lib/site'

/**
 * About hero — full-bleed worship photograph with the page's single h1.
 * Copy preserved verbatim from the original AboutHero.
 */
export default function AboutHero() {
  return (
    <FullBleed
      src="/images/worship-dancer.jpg"
      alt="A dancer in motion during a worship service at Amazing Grace Ministries"
      height="tall"
      align="center"
      priority
    >
      <Reveal>
        <p className="eyebrow text-white/70">Home / About Us</p>
        <h1 className="mt-4 font-display text-display-xl font-light uppercase tracking-display text-white">
          Who We Are
        </h1>
      </Reveal>
      <Reveal delay={1}>
        <p className="mt-6 font-display text-heading italic text-white/85">
          &ldquo;{site.heroVerse.text}&rdquo;
          <span className="ml-3 align-middle font-body text-body-sm not-italic tracking-wide text-white/60">
            &mdash; {site.heroVerse.reference}
          </span>
        </p>
      </Reveal>
    </FullBleed>
  )
}
