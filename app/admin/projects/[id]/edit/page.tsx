import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import ProjectForm from '@/components/admin/ProjectForm'
import { getProjectById } from '@/lib/projects'

export const metadata: Metadata = {
  title: 'Edit Project | Admin | Amazing Grace Ministries MN',
}

export const dynamic = 'force-dynamic'

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await getProjectById(id)
  if (!project) notFound()

  return (
    <div>
      <AdminHeader
        title="Edit Project"
        description={`Editing “${project.title}”. Raised, pledged, and donor counters are managed by the giving flows and can't be edited here.`}
      />
      <ProjectForm initial={project} />
    </div>
  )
}
