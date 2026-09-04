import FullBleed from '@/components/layout/FullBleed'
import Button from '@/components/ui/Button'
import Reveal from '@/components/ui/Reveal'

/**
 * Give hero — full-bleed photograph of the bassist in worship.
 * Copy preserved verbatim from the original GiveHero.
 */
export default function GiveHero() {
  return (
    <FullBleed
      src="/images/worship-bassist.jpg"
      alt="A bassist playing on stage during a worship service"
      height="tall"
      priority
    >
      <Reveal>
        <p className="eyebrow text-white/70">Home / Give</p>
        <h1 className="mt-4 max-w-3xl font-display text-display-lg font-light uppercase tracking-display text-white">
          Give With{' '}
          <span className="block font-medium normal-case italic">A Generous Heart.</span>
        </h1>
      </Reveal>
      <Reveal delay={1}>
        <p className="mt-6 max-w-xl font-display text-heading italic text-white/85">
          &ldquo;Each of you should give what you have decided in your heart to give.&rdquo;
          <span className="ml-3 align-middle font-body text-body-sm not-italic tracking-wide text-white/60">
            — 2 Corinthians 9:7
          </span>
        </p>
      </Reveal>
      <Reveal delay={2}>
        <div className="mt-10">
          <Button href="#giving-form" size="lg">
            Give Online Now
          </Button>
        </div>
      </Reveal>
    </FullBleed>
  )
}
