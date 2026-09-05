import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import PostForm from '@/components/admin/PostForm'
import { getPostById } from '@/lib/admin/posts'

export const metadata: Metadata = {
  title: 'Edit Post | Admin | Amazing Grace Ministries MN',
}

export const dynamic = 'force-dynamic'

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = await getPostById(id)
  if (!post) notFound()

  return (
    <div>
      <AdminHeader title="Edit Post" description={`Editing “${post.title}”.`} />
      <PostForm initial={post} />
    </div>
  )
}
