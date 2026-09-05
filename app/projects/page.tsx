import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { HandHeart } from 'lucide-react'
import AnnouncementBar from '@/components/AnnouncementBar'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import Section from '@/components/layout/Section'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import ProgressBar from '@/components/ui/ProgressBar'
import Reveal from '@/components/ui/Reveal'
import { listProjects, type Project } from '@/lib/projects'
import { formatUsd } from '@/lib/money'

export const metadata: Metadata = {
  title: 'Projects | Amazing Grace Ministries MN',
  description:
    'Give toward the building, outreach, and ministry projects of Amazing Grace Ministries MN — and watch the progress your generosity makes possible.',
}

// Projects live in Firestore — render per request, never prerender stale data.
export const dynamic = 'force-dynamic'

/** Firestore being unreachable must never take the page down. */
async function loadProjects(): Promise<Project[]> {
  try {
    return await listProjects()
  } catch (error) {
    console.error('[projects] failed to load projects', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return []
  }
}

function fundedPercent(project: Project): number {
  if (project.goalAmountCents <= 0) return 0
  return Math.min(100, Math.round((project.raisedAmountCents / project.goalAmountCents) * 100))
}

function daysRemaining(endDate: string | null): number | null {
  if (!endDate) return null
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000)
  return days >= 0 ? days : null
}

/** When there is no cover image, the numbers themselves carry the visual weight. */
function TypographicCover({ project }: { project: Project }) {
  return (
    <div
      aria-hidden
      className="flex aspect-[4/3] flex-col items-center justify-center bg-accent-subtle"
    >
      <p className="font-display text-display-xl font-light text-accent">
        {fundedPercent(project)}
        <span className="text-display-md">%</span>
      </p>
      <p className="eyebrow mt-2 text-accent">funded</p>
    </div>
  )
}

function ProjectRow({ project, flip }: { project: Project; flip: boolean }) {
  const percent = fundedPercent(project)
  const days = daysRemaining(project.endDate)
  return (
    <Reveal>
      <article className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
        <Link
          href={`/projects/${project.slug}`}
          className={`block overflow-hidden md:col-span-5 ${flip ? 'md:order-2' : ''}`}
        >
          {project.coverImage ? (
            <div className="relative aspect-[4/3]">
              <Image
                src={project.coverImage}
                alt={project.title}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          ) : (
            <TypographicCover project={project} />
          )}
        </Link>

        <div className={`md:col-span-7 ${flip ? 'md:order-1' : ''}`}>
          <div className="flex items-center gap-3">
            {project.status === 'funded' ? (
              <Badge variant="accent">Fully funded</Badge>
            ) : (
              <Badge variant="neutral">Active campaign</Badge>
            )}
            {days !== null && (
              <p className="text-caption text-text-muted">
                {days === 0 ? 'Ends today' : `${days} days remaining`}
              </p>
            )}
          </div>
          <h2 className="mt-4 font-display text-display-md font-medium tracking-display text-text-primary">
            <Link
              href={`/projects/${project.slug}`}
              className="transition-colors duration-200 hover:text-accent"
            >
              {project.title}
            </Link>
          </h2>
          <p className="mt-4 max-w-xl text-body text-text-secondary line-clamp-3">
            {project.description}
          </p>

          <div className="mt-8 max-w-xl">
            <ProgressBar
              value={project.raisedAmountCents}
              pledged={project.raisedAmountCents + project.pledgedAmountCents}
              max={project.goalAmountCents}
              label={`${formatUsd(project.raisedAmountCents)} raised of ${formatUsd(project.goalAmountCents)}`}
            />
            <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-body-sm">
              <span className="font-semibold text-accent">{percent}% funded</span>
              <span className="text-text-secondary">
                {project.donorCount} {project.donorCount === 1 ? 'giver' : 'givers'}
              </span>
              {project.pledgedAmountCents > 0 && (
                <span className="text-text-muted">
                  {formatUsd(project.pledgedAmountCents)} pledged
                </span>
              )}
            </div>
          </div>

          <div className="mt-8">
            <Button variant="link" href={`/projects/${project.slug}`}>
              View this project
            </Button>
          </div>
        </div>
      </article>
    </Reveal>
  )
}

export default async function ProjectsPage() {
  const projects = await loadProjects()

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <AnnouncementBar />

      <Section rhythm="normal" className="pt-32 md:pt-40">
        <Reveal>
          <p className="eyebrow text-accent">Faith in action</p>
          <h1 className="mt-4 max-w-3xl font-display text-display-lg font-medium tracking-display text-text-primary">
            Projects &amp; campaigns
          </h1>
          <p className="mt-5 max-w-2xl text-subheading text-text-secondary">
            From our building to our city — every campaign below is a specific, measurable work
            your generosity makes possible. Watch the needle move.
          </p>
        </Reveal>
      </Section>

      <Section rhythm="dense" className="pt-0">
        {projects.length === 0 ? (
          <EmptyState
            icon={<HandHeart className="size-6" aria-hidden />}
            title="No active campaigns"
            body="There are no fundraising projects open right now. You can still partner with the ministry through a gift to the general fund."
            action={
              <Button href="/give" size="lg">
                Give to the general fund
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-20 md:gap-28">
            {projects.map((project, index) => (
              <ProjectRow key={project.id} project={project} flip={index % 2 === 1} />
            ))}
          </div>
        )}
      </Section>

      <Footer />
    </main>
  )
}
