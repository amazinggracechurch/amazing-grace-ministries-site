import AnnouncementBar from '@/components/AnnouncementBar'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import GiveFAQ from '@/components/give/GiveFAQ'
import GiveHero from '@/components/give/GiveHero'
import GivingForm, { type GivingProject } from '@/components/give/GivingForm'
import GivingOptions from '@/components/give/GivingOptions'
import ImpactSection from '@/components/give/ImpactSection'
import ScriptureSection from '@/components/give/ScriptureSection'
import { has } from '@/lib/env'
import { getProjectBySlug, listProjects } from '@/lib/projects'

export const metadata = {
  title: 'Give | Amazing Grace Ministries MN',
  description: 'Partner with Amazing Grace Ministries MN through generous giving. Every gift makes an impact.',
}

type GivePageProps = {
  searchParams: Promise<{ project?: string }>
}

/** A ?project=<slug> gift target — unknown slugs silently fall back to a general gift. */
async function loadGivingProject(slug: string | undefined): Promise<GivingProject | undefined> {
  if (!slug) return undefined
  try {
    const project = await getProjectBySlug(slug)
    if (!project || project.status !== 'active') return undefined
    return {
      slug: project.slug,
      title: project.title,
      goalAmountCents: project.goalAmountCents,
      raisedAmountCents: project.raisedAmountCents,
    }
  } catch (error) {
    console.error('[give] failed to load project', {
      slug,
      message: error instanceof Error ? error.message : 'unknown',
    })
    return undefined
  }
}

/** Active funding projects donors can designate gifts toward. */
async function loadActiveProjects(): Promise<GivingProject[]> {
  try {
    const projects = await listProjects()
    return projects
      .filter((project) => project.status === 'active')
      .map((project) => ({
        slug: project.slug,
        title: project.title,
        goalAmountCents: project.goalAmountCents,
        raisedAmountCents: project.raisedAmountCents,
      }))
  } catch (error) {
    console.error('[give] failed to load projects', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return []
  }
}

export default async function GivePage({ searchParams }: GivePageProps) {
  const { project: projectSlug } = await searchParams
  const [project, projects] = await Promise.all([
    loadGivingProject(projectSlug),
    loadActiveProjects(),
  ])

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <AnnouncementBar />
      <GiveHero />
      <GivingOptions />
      <GivingForm stripeEnabled={has.stripe()} project={project} projects={projects} />
      <ImpactSection />
      <ScriptureSection />
      <GiveFAQ />
      <Footer />
    </main>
  )
}
