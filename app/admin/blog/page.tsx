import type { Metadata } from 'next'
import AdminHeader from '@/components/admin/AdminHeader'
import Badge, { type BadgeVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { listAllPosts, type AdminPost } from '@/lib/admin/posts'

export const metadata: Metadata = {
  title: 'Blog | Admin | Amazing Grace Ministries MN',
}

export const dynamic = 'force-dynamic'

const STATUS_VARIANTS: Record<AdminPost['status'], BadgeVariant> = {
  draft: 'neutral',
  published: 'success',
  scheduled: 'warning',
}

export default async function AdminBlogPage() {
  const posts = await listAllPosts()

  return (
    <div>
      <AdminHeader
        title="Blog"
        description="Announcements and sermon texts. Bodies are structured blocks — the editor never accepts raw HTML."
        action={
          <Button href="/admin/blog/new" variant="primary">
            New post
          </Button>
        }
      />
      {posts.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No posts yet"
            body="Write your first announcement or sermon text."
            action={
              <Button href="/admin/blog/new" variant="primary">
                New post
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border-strong text-caption uppercase tracking-eyebrow text-text-muted">
                <th scope="col" className="py-3 pr-4 font-semibold">Type</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Title</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Status</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Publishes</th>
                <th scope="col" className="py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-border-subtle align-middle">
                  <td className="py-4 pr-4">
                    <Badge variant={post.type === 'sermon' ? 'accent' : 'neutral'}>
                      {post.type}
                    </Badge>
                  </td>
                  <td className="py-4 pr-4">
                    <span className="text-body font-semibold text-text-primary">{post.title}</span>
                    <span className="block text-caption text-text-muted">/{post.slug}</span>
                  </td>
                  <td className="py-4 pr-4">
                    <Badge variant={STATUS_VARIANTS[post.status]}>{post.status}</Badge>
                  </td>
                  <td className="py-4 pr-4 text-body-sm text-text-secondary">
                    {new Date(post.publishAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      timeZone: 'America/Chicago',
                    })}
                  </td>
                  <td className="py-4">
                    <Button href={`/admin/blog/${post.id}/edit`} variant="secondary" size="sm">
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
