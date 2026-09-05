import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { HandHeart } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import ProgressBar from '@/components/ui/ProgressBar'
import Reveal from '@/components/ui/Reveal'
import CancelPledgeButton from '@/components/account/CancelPledgeButton'
import { getSessionUser } from '@/lib/auth/session'
import { getPledgesForUser, pledgeRemainingCents, type Pledge } from '@/lib/pledges'
import { getProjectById, type Project } from '@/lib/projects'
import { formatUsd } from '@/lib/money'

export const metadata: Metadata = {
  title: 'My Pledges | Amazing Grace Ministries MN',
  description: 'Track and fulfill your pledges to Amazing Grace Ministries projects.',
}

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<Pledge['status'], string> = {
  active: 'Active',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
}

const FREQUENCY_LABEL: Record<Pledge['frequency'], string> = {
  'one-time': 'One-time',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
}

/** A pledge whose project was deleted still renders, just without a link. */
type PledgeWithProject = {
  pledge: Pledge
  project: Project | null
}

async function loadPledges(userId: string): Promise<PledgeWithProject[]> {
  try {
    const pledges = await getPledgesForUser(userId)
    const projects = await Promise.all(
      [...new Set(pledges.map((pledge) => pledge.projectId))].map((id) =>
        getProjectById(id).catch(() => null)
      )
    )
    const byId = new Map(projects.filter(Boolean).map((project) => [project!.id, project!]))
    return pledges.map((pledge) => ({ pledge, project: byId.get(pledge.projectId) ?? null }))
  } catch (error) {
    console.error('[account] failed to load pledges', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return []
  }
}

export default async function PledgesPage() {
  // The (protected) layout already enforced this; re-check so the page
  // never renders unauthenticated even if reused elsewhere.
  const user = await getSessionUser()
  if (!user) redirect('/account/signin?next=/account/pledges')

  const entries = await loadPledges(user.uid)

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <section className="flex-1 pt-32 pb-24 md:pt-40">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="eyebrow text-text-muted">Member Portal</p>
            <h1 className="mt-4 font-display text-display-md font-light uppercase tracking-display text-text-primary">
              My Pledges
              <span className="text-accent">.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-body text-text-secondary">
              Promises you have made to specific projects. Every gift you make toward a project
              counts against your open pledge there automatically.
            </p>
          </Reveal>

          <div className="mt-14">
            {entries.length === 0 ? (
              <EmptyState
                icon={<HandHeart className="size-6" aria-hidden />}
                title="No pledges yet"
                body="When you pledge toward a project, it will show up here so you can track your progress and fulfill it over time."
                action={<Button href="/projects">Browse projects</Button>}
              />
            ) : (
              <div className="flex flex-col gap-6">
                {entries.map(({ pledge, project }) => {
                  const remaining = pledgeRemainingCents(pledge)
                  const percent =
                    pledge.amountCents > 0
                      ? Math.min(
                          100,
                          Math.round((pledge.fulfilledAmountCents / pledge.amountCents) * 100)
                        )
                      : 0
                  return (
                    <Reveal key={pledge.id}>
                      <article className="border border-border-subtle bg-surface-raised p-6 sm:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <Badge variant={pledge.status === 'fulfilled' ? 'accent' : 'neutral'}>
                                {STATUS_LABEL[pledge.status]}
                              </Badge>
                              <span className="text-caption text-text-muted">
                                {FREQUENCY_LABEL[pledge.frequency]}
                              </span>
                            </div>
                            <h2 className="mt-3 font-display text-heading font-medium tracking-display text-text-primary">
                              {project ? (
                                <Link
                                  href={`/projects/${project.slug}`}
                                  className="transition-colors duration-200 hover:text-accent"
                                >
                                  {project.title}
                                </Link>
                              ) : (
                                'Project no longer available'
                              )}
                            </h2>
                          </div>
                          <p className="font-display text-heading font-medium text-text-primary">
                            {formatUsd(pledge.amountCents)}
                          </p>
                        </div>

                        <div className="mt-6 max-w-2xl">
                          <ProgressBar
                            value={pledge.fulfilledAmountCents}
                            max={pledge.amountCents}
                            label={`${formatUsd(pledge.fulfilledAmountCents)} given of ${formatUsd(pledge.amountCents)}`}
                          />
                          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-body-sm">
                            <span className="font-semibold text-accent">{percent}% fulfilled</span>
                            <span className="text-text-secondary">
                              {formatUsd(remaining)} remaining
                            </span>
                          </div>
                        </div>

                        {pledge.status === 'active' && (
                          <div className="mt-6 flex flex-wrap items-center gap-4">
                            {project && project.status === 'active' && (
                              <Button href={`/give?project=${project.slug}`} size="sm">
                                Give toward this pledge
                              </Button>
                            )}
                            <CancelPledgeButton pledgeId={pledge.id} />
                          </div>
                        )}
                      </article>
                    </Reveal>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
