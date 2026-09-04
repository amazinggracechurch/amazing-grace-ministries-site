import FullBleed from '@/components/layout/FullBleed'
import Reveal from '@/components/ui/Reveal'

/**
 * Contact hero — full-bleed worship photograph, headline overlaid.
 * The one h1 on the page lives here.
 */
export default function ContactHero() {
  return (
    <FullBleed
      src="/images/hero-worship.jpg"
      alt="A worship leader singing with joy as the congregation celebrates"
      height="tall"
      priority
    >
      <Reveal>
        <p className="eyebrow text-white/70">Home / Contact</p>
        <h1 className="mt-4 max-w-4xl font-display text-display-lg font-light uppercase tracking-display text-white">
          We&apos;d Love To{' '}
          <span className="block italic normal-case">Hear From You.</span>
        </h1>
      </Reveal>
      <Reveal delay={1}>
        <p className="mt-6 max-w-xl font-display text-heading italic text-white/85">
          &ldquo;No question is too small. No need is too great.&rdquo;
        </p>
      </Reveal>
    </FullBleed>
  )
}
