import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import type { Post } from '@/lib/posts'
import { readingTimeMinutes } from '@/lib/posts'
import { formatAirDate } from '@/lib/sermons'

type PostRowProps = {
  post: Post
}

function metaLine(post: Post): string[] {
  const parts: string[] = []
  if (post.type === 'sermon') {
    if (post.speaker) parts.push(post.speaker)
    if (post.scriptureRef) parts.push(post.scriptureRef)
    if (post.series) parts.push(post.series)
  } else if (post.speaker) {
    parts.push(post.speaker)
  }
  parts.push(`${readingTimeMinutes(post.body)} min read`)
  return parts
}

/**
 * One row of the editorial index — date eyebrow, Cormorant title,
 * excerpt, meta line. Deliberately not a card: the blog reads like a
 * table of contents, not a product grid.
 */
export default function PostRow({ post }: PostRowProps) {
  return (
    <article className="border-b border-border-subtle py-10 first:pt-0 last:border-b-0">
      <p className="eyebrow text-text-muted">{formatAirDate(post.publishAt)}</p>
      <h2 className="mt-3 font-display font-medium text-heading tracking-display text-text-primary">
        <Link href={`/blog/${post.slug}`} className="transition-colors duration-200 hover:text-accent">
          {post.title}
        </Link>
      </h2>
      {post.excerpt && (
        <p className="mt-3 max-w-[65ch] text-body text-text-secondary">{post.excerpt}</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Badge variant={post.type === 'sermon' ? 'accent' : 'neutral'}>
          {post.type === 'sermon' ? 'Sermon' : 'Announcement'}
        </Badge>
        <p className="text-caption text-text-muted">{metaLine(post).join(' · ')}</p>
      </div>
    </article>
  )
}
