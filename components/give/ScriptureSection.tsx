import PullQuote from '@/components/layout/PullQuote'
import Reveal from '@/components/ui/Reveal'

/**
 * Scripture — a centered pull-quote in italic Cormorant, the site's
 * signature gesture. Copy preserved verbatim from the original
 * ScriptureSection.
 */
export default function ScriptureSection() {
  return (
    <section aria-label="Scripture on giving" className="py-20 md:py-28">
      <Reveal>
        <PullQuote cite="2 Corinthians 9:6">
          &ldquo;Remember this: Whoever sows sparingly will also reap sparingly, and whoever sows
          generously will also reap generously.&rdquo;
        </PullQuote>
      </Reveal>
    </section>
  )
}
