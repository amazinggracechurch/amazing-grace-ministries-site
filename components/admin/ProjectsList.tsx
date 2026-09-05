'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Star } from 'lucide-react'
import Badge, { type BadgeVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import EmptyState from '@/components/ui/EmptyState'
import ProgressBar from '@/components/ui/ProgressBar'
import type { Project, ProjectStatus } from '@/lib/projects'
import { formatUsd } from '@/lib/money'

const STATUS_VARIANTS: Record<ProjectStatus, BadgeVariant> = {
  draft: 'neutral',
  active: 'accent',
  funded: 'success',
  completed: 'success',
  archived: 'warning',
}

export type ProjectsListProps = {
  projects: Project[]
}

/** Projects table with progress, status, and a confirm-dialog archive action. */
export default function ProjectsList({ projects }: ProjectsListProps) {
  const router = useRouter()
  const [archiveTarget, setArchiveTarget] = useState<Project | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmArchive() {
    if (!archiveTarget) return
    setArchiving(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/projects/${archiveTarget.id}/archive`, {
        method: 'POST',
      })
      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        setError(data.error ?? 'Could not archive the project.')
        return
      }
      setArchiveTarget(null)
      router.refresh()
    } catch {
      setError('Could not archive the project. Please try again.')
    } finally {
      setArchiving(false)
    }
  }

  if (projects.length === 0) {
    return (
      <div className="mt-10">
        <EmptyState
          title="No projects yet"
          body="Create your first funding project to start accepting designated gifts."
          action={
            <Button href="/admin/projects/new" variant="primary">
              New project
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="mt-10 overflow-x-auto">
      {error && (
        <p role="alert" className="mb-4 text-body-sm text-danger">
          {error}
        </p>
      )}
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border-strong text-caption uppercase tracking-eyebrow text-text-muted">
            <th scope="col" className="py-3 pr-4 font-semibold">Project</th>
            <th scope="col" className="py-3 pr-4 font-semibold">Status</th>
            <th scope="col" className="py-3 pr-4 font-semibold">Progress</th>
            <th scope="col" className="py-3 pr-4 font-semibold">Raised / Goal</th>
            <th scope="col" className="py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="border-b border-border-subtle align-middle">
              <td className="py-4 pr-4">
                <span className="flex items-center gap-2 text-body font-semibold text-text-primary">
                  {project.featured && (
                    <Star className="size-4 fill-accent text-accent" aria-label="Featured" />
                  )}
                  {project.title}
                </span>
                <span className="text-caption text-text-muted">/{project.slug}</span>
              </td>
              <td className="py-4 pr-4">
                <Badge variant={STATUS_VARIANTS[project.status]}>{project.status}</Badge>
              </td>
              <td className="w-48 py-4 pr-4">
                <ProgressBar
                  value={project.raisedAmountCents}
                  max={Math.max(project.goalAmountCents, 1)}
                  pledged={project.pledgedAmountCents}
                />
              </td>
              <td className="py-4 pr-4 text-body-sm text-text-secondary">
                {formatUsd(project.raisedAmountCents)} / {formatUsd(project.goalAmountCents)}
              </td>
              <td className="py-4">
                <div className="flex flex-wrap gap-2">
                  <Button href={`/admin/projects/${project.id}/edit`} variant="secondary" size="sm">
                    Edit
                  </Button>
                  {project.status !== 'archived' && (
                    <Button variant="ghost" size="sm" onClick={() => setArchiveTarget(project)}>
                      Archive
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog
        open={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
        title="Archive this project?"
      >
        <p className="text-body text-text-secondary">
          <span className="font-semibold text-text-primary">{archiveTarget?.title}</span> will
          disappear from the public site. Its donation history is kept. You can bring it back
          later by editing its status.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setArchiveTarget(null)}>
            Cancel
          </Button>
          <Button variant="primary" disabled={archiving} onClick={confirmArchive}>
            {archiving ? 'Archiving…' : 'Archive project'}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
