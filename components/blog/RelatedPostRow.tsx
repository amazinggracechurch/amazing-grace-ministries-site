import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import type { Post } from '@/lib/posts'
import { formatAirDate } from '@/lib/sermons'

type RelatedPostRowProps = {
  post: Post
}

/** Compact row for the related-posts ScrollRail at the foot of an article. */
export default function RelatedPostRow({ post }: RelatedPostRowProps) {
  return (
    <article className="w-64 border border-border-subtle bg-surface-raised p-5">
      <p className="eyebrow text-text-muted">{formatAirDate(post.publishAt)}</p>
      <h3 className="mt-2 font-display font-medium text-subheading tracking-display text-text-primary">
        <Link href={`/blog/${post.slug}`} className="transition-colors duration-200 hover:text-accent">
          {post.title}
        </Link>
      </h3>
      <div className="mt-3">
        <Badge variant={post.type === 'sermon' ? 'accent' : 'neutral'}>
          {post.type === 'sermon' ? 'Sermon' : 'Announcement'}
        </Badge>
      </div>
    </article>
  )
}
