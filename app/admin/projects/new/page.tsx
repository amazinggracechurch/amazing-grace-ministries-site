import type { Metadata } from 'next'
import AdminHeader from '@/components/admin/AdminHeader'
import ProjectForm from '@/components/admin/ProjectForm'

export const metadata: Metadata = {
  title: 'New Project | Admin | Amazing Grace Ministries MN',
}

export const dynamic = 'force-dynamic'

export default function NewProjectPage() {
  return (
    <div>
      <AdminHeader title="New Project" description="Create a funding campaign." />
      <ProjectForm />
    </div>
  )
}
