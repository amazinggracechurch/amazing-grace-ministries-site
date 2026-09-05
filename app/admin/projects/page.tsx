import type { Metadata } from 'next'
import AdminHeader from '@/components/admin/AdminHeader'
import ProjectsList from '@/components/admin/ProjectsList'
import Button from '@/components/ui/Button'
import { listProjects } from '@/lib/projects'

export const metadata: Metadata = {
  title: 'Projects | Admin | Amazing Grace Ministries MN',
}

export const dynamic = 'force-dynamic'

export default async function AdminProjectsPage() {
  const projects = await listProjects({ includeUnpublished: true })

  return (
    <div>
      <AdminHeader
        title="Projects"
        description="Funding campaigns shown on the projects page. Counters update from gifts — edit content and status here."
        action={
          <Button href="/admin/projects/new" variant="primary">
            New project
          </Button>
        }
      />
      <ProjectsList projects={projects} />
    </div>
  )
}
