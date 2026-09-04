import Button from '@/components/ui/Button'
import FullBleed from '@/components/layout/FullBleed'
import Reveal from '@/components/ui/Reveal'

/**
 * Giving invitation — full-bleed black-and-white worship photograph.
 * The live project progress bar joins this band in Phase 2.
 */
export default function GivingBand() {
  return (
    <FullBleed
      src="/images/worship-band-bw.jpg"
      alt="The church band — keys, guitar, and saxophone — leading worship, in black and white"
      height="band"
    >
      <Reveal>
        <p className="eyebrow text-white/70">Generosity</p>
        <h2 className="mt-4 max-w-2xl font-display text-display-md font-medium tracking-display">
          Give toward the work God is doing here
        </h2>
        <p className="mt-5 max-w-xl text-subheading text-white/80">
          Every gift fuels the ministry, outreach, and care of this community.
        </p>
        <div className="mt-8">
          <Button href="/give" size="lg">
            Give Online
          </Button>
        </div>
      </Reveal>
    </FullBleed>
  )
}
