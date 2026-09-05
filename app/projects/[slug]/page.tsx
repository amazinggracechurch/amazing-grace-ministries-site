import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AnnouncementBar from '@/components/AnnouncementBar'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import FullBleed from '@/components/layout/FullBleed'
import Section from '@/components/layout/Section'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import Reveal from '@/components/ui/Reveal'
import PledgeForm from '@/components/projects/PledgeForm'
import { getSessionUser } from '@/lib/auth/session'
import { getProjectBySlug, type Project } from '@/lib/projects'
import { formatUsd } from '@/lib/money'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ slug: string }>
}

async function loadProject(slug: string): Promise<Project | null> {
  try {
    return await getProjectBySlug(slug)
  } catch (error) {
    console.error('[projects] failed to load project', {
      slug,
      message: error instanceof Error ? error.message : 'unknown',
    })
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const project = await loadProject(slug)
  if (!project) {
    return { title: 'Project Not Found | Amazing Grace Ministries MN' }
  }
  const description =
    project.description.length > 160
      ? `${project.description.slice(0, 157)}…`
      : project.description
  return {
    title: `${project.title} | Amazing Grace Ministries MN`,
    description,
    openGraph: {
      title: project.title,
      description,
      type: 'website',
      ...(project.coverImage ? { images: [{ url: project.coverImage }] } : {}),
    },
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

function ProjectHero({ project }: { project: Project }) {
  const statusBadge =
    project.status === 'funded' ? (
      <Badge variant="accent">Fully funded</Badge>
    ) : (
      <Badge variant="neutral">Active campaign</Badge>
    )

  if (project.coverImage) {
    return (
      <FullBleed src={project.coverImage} alt={project.title} height="tall" priority>
        <Reveal>
          {statusBadge}
          <h1 className="mt-4 max-w-3xl font-display text-display-lg font-medium tracking-display">
            {project.title}
          </h1>
        </Reveal>
      </FullBleed>
    )
  }

  // No cover — the goal itself becomes the display type.
  return (
    <Section rhythm="normal" className="pt-32 md:pt-40">
      <Reveal>
        {statusBadge}
        <h1 className="mt-4 max-w-3xl font-display text-display-lg font-medium tracking-display text-text-primary">
          {project.title}
        </h1>
        <p className="mt-8 font-display text-display-xl font-light text-accent">
          {formatUsd(project.goalAmountCents)}
          <span className="ml-3 align-middle font-body text-subheading text-text-muted">
            the goal
          </span>
        </p>
      </Reveal>
    </Section>
  )
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params
  const project = await loadProject(slug)
  if (!project) notFound()

  const user = await getSessionUser()
  const percent = fundedPercent(project)
  const days = daysRemaining(project.endDate)
  const paragraphs = project.description.split(/\n{2,}/).filter((p) => p.trim() !== '')

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <AnnouncementBar />

      <ProjectHero project={project} />

      <Section rhythm="dense" sunken>
        <Reveal>
          <div className="grid gap-10 md:grid-cols-12 md:items-end">
            <div className="md:col-span-5">
              <p className="eyebrow text-text-muted">Raised so far</p>
              <p className="mt-3 font-display text-display-lg font-light text-text-primary">
                {formatUsd(project.raisedAmountCents)}
              </p>
              <p className="mt-2 text-subheading text-text-secondary">
                of a {formatUsd(project.goalAmountCents)} goal
              </p>
            </div>
            <div className="md:col-span-7">
              <ProgressBar
                value={project.raisedAmountCents}
                pledged={project.raisedAmountCents + project.pledgedAmountCents}
                max={project.goalAmountCents}
                label="Campaign progress"
              />
              <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-body-sm">
                <div className="flex items-baseline gap-2">
                  <dt className="text-text-muted">Funded</dt>
                  <dd className="font-semibold text-accent">{percent}%</dd>
                </div>
                <div className="flex items-baseline gap-2">
                  <dt className="text-text-muted">Givers</dt>
                  <dd className="font-semibold text-text-primary">{project.donorCount}</dd>
                </div>
                {project.pledgedAmountCents > 0 && (
                  <div className="flex items-baseline gap-2">
                    <dt className="text-text-muted">Pledged</dt>
                    <dd className="font-semibold text-text-primary">
                      {formatUsd(project.pledgedAmountCents)}
                    </dd>
                  </div>
                )}
                {days !== null && (
                  <div className="flex items-baseline gap-2">
                    <dt className="text-text-muted">Time left</dt>
                    <dd className="font-semibold text-text-primary">
                      {days === 0 ? 'Ends today' : `${days} days`}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button href={`/give?project=${project.slug}`} size="lg">
              Give to this project
            </Button>
            {!user && (
              <Button
                variant="secondary"
                href={`/account/signin?next=/projects/${project.slug}`}
                size="lg"
              >
                Sign in to pledge
              </Button>
            )}
          </div>
        </Reveal>
      </Section>

      {paragraphs.length > 0 && (
        <Section rhythm="normal">
          <Reveal>
            <div className="max-w-[65ch]">
              <h2 className="font-display text-display-md font-medium tracking-display text-text-primary">
                About this project
              </h2>
              <div className="mt-6 flex flex-col gap-5 text-body text-text-secondary">
                {paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </Reveal>
        </Section>
      )}

      {user && project.status === 'active' && (
        <Section rhythm="normal" sunken>
          <Reveal>
            <div className="grid gap-10 md:grid-cols-12">
              <div className="md:col-span-5">
                <p className="eyebrow text-accent">Make a pledge</p>
                <h2 className="mt-4 font-display text-display-md font-medium tracking-display text-text-primary">
                  Commit over time
                </h2>
                <p className="mt-5 text-body text-text-secondary">
                  A pledge is a promise, not a payment — nothing is charged today. Tell us what
                  you intend to give, then fulfill it gift by gift. Your progress is tracked in
                  your account, and every gift you make to this project counts against your
                  pledge automatically.
                </p>
              </div>
              <div className="md:col-span-7">
                <PledgeForm projectSlug={project.slug} />
              </div>
            </div>
          </Reveal>
        </Section>
      )}

      <Footer />
    </main>
  )
}
