import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AnnouncementBar from '@/components/AnnouncementBar'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import RelatedPostRow from '@/components/blog/RelatedPostRow'
import ShareLinks from '@/components/blog/ShareLinks'
import ScrollRail from '@/components/layout/ScrollRail'
import Section from '@/components/layout/Section'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Reveal from '@/components/ui/Reveal'
import { env } from '@/lib/env'
import {
  getAdjacentPosts,
  getPostBySlug,
  getRelatedPosts,
  readingTimeMinutes,
} from '@/lib/posts'
import { renderBlocks } from '@/lib/posts/render'
import { formatAirDate } from '@/lib/sermons'

export const revalidate = 3600

type PostPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) {
    return { title: 'Post not found' }
  }
  const description = post.seo?.description ?? post.excerpt
  const ogImage = post.seo?.ogImage ?? post.coverImage ?? undefined
  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      publishedTime: post.publishAt,
      authors: [post.author.name],
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const [{ prev, next }, related] = await Promise.all([
    getAdjacentPosts(post),
    getRelatedPosts(post, 6),
  ])

  const base = env.siteUrl()
  const postUrl = `${base}/blog/${post.slug}`
  const minutes = readingTimeMinutes(post.body)
  const imageUrl = post.coverImage
    ? post.coverImage.startsWith('http')
      ? post.coverImage
      : `${base}${post.coverImage}`
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seo?.description ?? post.excerpt,
    datePublished: post.publishAt,
    author: { '@type': 'Person', name: post.author.name },
    ...(imageUrl ? { image: [imageUrl] } : {}),
    mainEntityOfPage: postUrl,
  }

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <Navbar />
      <AnnouncementBar />

      <article>
        <Section rhythm="normal">
          <Reveal>
            <div className="max-w-[65ch]">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <Badge variant={post.type === 'sermon' ? 'accent' : 'neutral'}>
                  {post.type === 'sermon' ? 'Sermon' : 'Announcement'}
                </Badge>
                {post.series && (
                  <p className="eyebrow text-accent">{post.series}</p>
                )}
              </div>
              <h1 className="mt-4 font-display font-medium text-display-lg tracking-display text-text-primary">
                {post.title}
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
                <span className="flex items-center gap-3">
                  <Avatar name={post.author.name} src={post.author.avatarUrl} size="sm" />
                  <span className="text-body-sm font-semibold text-text-primary">
                    {post.author.name}
                  </span>
                </span>
                <span aria-hidden="true" className="text-text-muted">
                  ·
                </span>
                <time dateTime={post.publishAt} className="text-body-sm text-text-muted">
                  {formatAirDate(post.publishAt)}
                </time>
                <span aria-hidden="true" className="text-text-muted">
                  ·
                </span>
                <span className="text-body-sm text-text-muted">{minutes} min read</span>
                {post.scriptureRef && (
                  <>
                    <span aria-hidden="true" className="text-text-muted">
                      ·
                    </span>
                    <span className="text-body-sm text-text-muted">{post.scriptureRef}</span>
                  </>
                )}
              </div>
            </div>
          </Reveal>

          {post.coverImage && (
            <Reveal delay={1} className="mt-10">
              <div className="relative aspect-video max-w-4xl overflow-hidden">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  priority
                  sizes="(max-width: 896px) 100vw, 896px"
                  className="object-cover"
                />
              </div>
            </Reveal>
          )}

          <Reveal delay={post.coverImage ? 2 : 1} className="mt-12">
            {renderBlocks(post.body, { dropCapFirstParagraph: true })}
          </Reveal>

          <div className="mt-14 border-t border-border-subtle pt-8">
            <ShareLinks url={postUrl} title={post.title} />
          </div>
        </Section>

        {(prev || next) && (
          <Section rhythm="dense" className="pt-0">
            <nav aria-label="More posts" className="grid gap-6 border-t border-border-subtle pt-10 sm:grid-cols-2">
              <div>
                {prev && (
                  <>
                    <p className="eyebrow text-text-muted">Older</p>
                    <Link
                      href={`/blog/${prev.slug}`}
                      className="mt-2 block font-display font-medium text-heading tracking-display text-text-primary transition-colors duration-200 hover:text-accent"
                    >
                      {prev.title}
                    </Link>
                  </>
                )}
              </div>
              <div className="sm:text-right">
                {next && (
                  <>
                    <p className="eyebrow text-text-muted">Newer</p>
                    <Link
                      href={`/blog/${next.slug}`}
                      className="mt-2 block font-display font-medium text-heading tracking-display text-text-primary transition-colors duration-200 hover:text-accent"
                    >
                      {next.title}
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </Section>
        )}

        {related.length > 0 && (
          <Section rhythm="dense" sunken>
            <Reveal>
              <h2 className="font-display font-medium text-display-md tracking-display text-text-primary">
                Keep reading
              </h2>
              <ScrollRail label="Related posts" className="mt-8">
                {related.map((rel) => (
                  <RelatedPostRow key={rel.id} post={rel} />
                ))}
              </ScrollRail>
            </Reveal>
          </Section>
        )}
      </article>

      <Footer />
    </main>
  )
}
