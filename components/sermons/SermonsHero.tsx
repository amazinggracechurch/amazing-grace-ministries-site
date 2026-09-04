import { Play } from 'lucide-react'
import FullBleed from '@/components/layout/FullBleed'
import Button from '@/components/ui/Button'
import Reveal from '@/components/ui/Reveal'

/**
 * Sermons hero — full-bleed pulpit photograph. Carries the page's only h1.
 */
export default function SermonsHero() {
  return (
    <FullBleed
      src="/images/sermon-pulpit.jpg"
      alt="Pastor Nnaemeka Uchegbu preaching from the pulpit during a service"
      height="tall"
      priority
    >
      <Reveal>
        <p className="eyebrow text-white/70">Home / Sermons</p>
        <h1 className="mt-4 max-w-4xl font-display text-display-lg font-light uppercase tracking-display">
          The Word
          <span className="block font-medium normal-case italic">Always Available.</span>
        </h1>
      </Reveal>
      <Reveal delay={1}>
        <p className="mt-6 max-w-xl font-display text-heading italic text-white/85">
          &ldquo;Faith comes by hearing, and hearing by the Word of God.&rdquo;
          <span className="ml-3 align-middle font-body text-body-sm not-italic tracking-wide text-white/60">
            &mdash; Romans 10:17
          </span>
        </p>
      </Reveal>
      <Reveal delay={2}>
        <div className="mt-10">
          <Button href="#latest" size="lg">
            <Play className="size-4" aria-hidden />
            Watch Latest Sermon
          </Button>
        </div>
      </Reveal>
    </FullBleed>
  )
}
