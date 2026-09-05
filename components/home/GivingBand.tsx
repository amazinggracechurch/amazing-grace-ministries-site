import Button from '@/components/ui/Button'
import FullBleed from '@/components/layout/FullBleed'
import Reveal from '@/components/ui/Reveal'
import { formatUsd } from '@/lib/money'

/** The featured active campaign the home band can champion (spec §7.3). */
export type FeaturedProject = {
  title: string
  slug: string
  goalAmountCents: number
  raisedAmountCents: number
  pledgedAmountCents: number
}

type GivingBandProps = {
  /** When present, the band champions this campaign instead of generic copy. */
  project?: FeaturedProject | null
}

/**
 * Giving invitation — full-bleed black-and-white worship photograph.
 * When a featured project exists, the band carries its live progress.
 */
export default function GivingBand({ project }: GivingBandProps) {
  if (project) {
    const percent =
      project.goalAmountCents > 0
        ? Math.min(100, Math.round((project.raisedAmountCents / project.goalAmountCents) * 100))
        : 0
    const width = (amount: number) =>
      `${Math.min(100, Math.max(0, (amount / Math.max(1, project.goalAmountCents)) * 100))}%`
    return (
      <FullBleed
        src="/images/worship-band-bw.jpg"
        alt="The church band — keys, guitar, and saxophone — leading worship, in black and white"
        height="band"
      >
        <Reveal>
          <p className="eyebrow text-white/70">Featured Project</p>
          <h2 className="mt-4 max-w-2xl font-display text-display-md font-medium tracking-display">
            {project.title}
          </h2>
          <div className="mt-6 max-w-xl">
            <div
              role="progressbar"
              aria-valuenow={project.raisedAmountCents}
              aria-valuemin={0}
              aria-valuemax={project.goalAmountCents}
              aria-label={`${project.title} campaign progress`}
              className="relative h-2 overflow-hidden bg-white/25"
            >
              <div
                className="absolute inset-y-0 left-0 bg-white/40"
                style={{ width: width(project.raisedAmountCents + project.pledgedAmountCents) }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-accent"
                style={{ width: width(project.raisedAmountCents) }}
              />
            </div>
            <p className="mt-3 text-body-sm text-white/80">
              <span className="font-semibold text-white">
                {formatUsd(project.raisedAmountCents)}
              </span>{' '}
              raised of {formatUsd(project.goalAmountCents)} · {percent}% funded
            </p>
          </div>
          <div className="mt-8">
            <Button href={`/projects/${project.slug}`} size="lg">
              Give to {project.title}
            </Button>
          </div>
        </Reveal>
      </FullBleed>
    )
  }

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
