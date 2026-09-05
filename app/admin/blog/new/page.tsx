import type { Metadata } from 'next'
import AdminHeader from '@/components/admin/AdminHeader'
import PostForm from '@/components/admin/PostForm'

export const metadata: Metadata = {
  title: 'New Post | Admin | Amazing Grace Ministries MN',
}

export const dynamic = 'force-dynamic'

export default function NewPostPage() {
  return (
    <div>
      <AdminHeader title="New Post" description="Write an announcement or sermon text." />
      <PostForm />
    </div>
  )
}
