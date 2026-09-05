import type { Metadata } from 'next'
import { FileText, Rss } from 'lucide-react'
import Link from 'next/link'
import AnnouncementBar from '@/components/AnnouncementBar'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import FilterBar from '@/components/blog/FilterBar'
import PostRow from '@/components/blog/PostRow'
import Section from '@/components/layout/Section'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Pagination from '@/components/ui/Pagination'
import Reveal from '@/components/ui/Reveal'
import { listPublishedPosts, listSeries, listSpeakers } from '@/lib/posts'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Sermon texts and announcements from Amazing Grace Ministries MN — read the messages again, catch up on church news, and share them with a friend.',
  alternates: {
    types: { 'application/rss+xml': '/blog/rss.xml' },
  },
}

type BlogSearchParams = Promise<{ [key: string]: string | string[] | undefined }>

function first(value: string | string[] | undefined): string | undefined {
  const single = Array.isArray(value) ? value[0] : value
  return single && single.length > 0 ? single : undefined
}

export default async function BlogPage({ searchParams }: { searchParams: BlogSearchParams }) {
  const params = await searchParams
  const typeParam = first(params.type)
  const type = typeParam === 'sermon' || typeParam === 'announcement' ? typeParam : undefined
  const series = first(params.series)
  const speaker = first(params.speaker)
  const query = first(params.q)
  const parsedPage = Number.parseInt(first(params.page) ?? '1', 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1

  const [result, seriesOptions, speakerOptions] = await Promise.all([
    listPublishedPosts({ type, series, speaker, query, page, pageSize: 8 }),
    listSeries(),
    listSpeakers(),
  ])

  const hrefFor = (target: number): string => {
    const sp = new URLSearchParams()
    if (type) sp.set('type', type)
    if (series) sp.set('series', series)
    if (speaker) sp.set('speaker', speaker)
    if (query) sp.set('q', query)
    if (target > 1) sp.set('page', String(target))
    const qs = sp.toString()
    return qs ? `/blog?${qs}` : '/blog'
  }

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <AnnouncementBar />

      {/* Typographic hero — no photo. The other pages own the photo-hero archetype. */}
      <Section rhythm="normal">
        <Reveal>
          <p className="eyebrow text-accent mb-4">Blog &amp; Sermon Texts</p>
          <h1 className="font-display font-medium text-display-lg tracking-display text-text-primary">
            Words to carry with you
          </h1>
          <p className="mt-5 max-w-2xl text-subheading text-text-secondary">
            Read the messages again at your own pace — sermon texts from Sunday,
            plus announcements from the life of the church.
          </p>
        </Reveal>

        <Reveal delay={1} className="mt-12">
          <FilterBar
            type={type}
            series={series}
            speaker={speaker}
            query={query}
            seriesOptions={seriesOptions}
            speakerOptions={speakerOptions}
          />
        </Reveal>
      </Section>

      <Section rhythm="dense" className="pt-0">
        {result.posts.length === 0 ? (
          <EmptyState
            icon={<FileText className="size-6" aria-hidden="true" />}
            title="Nothing here yet"
            body="No posts match these filters. Try a different combination, or browse everything."
            action={
              <Button href="/blog" variant="secondary" size="sm">
                View all posts
              </Button>
            }
          />
        ) : (
          <>
            <Reveal>
              <p className="eyebrow text-text-muted mb-2">
                {result.total} {result.total === 1 ? 'post' : 'posts'}
              </p>
              <div>
                {result.posts.map((post) => (
                  <PostRow key={post.id} post={post} />
                ))}
              </div>
            </Reveal>
            {result.totalPages > 1 && (
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                hrefFor={hrefFor}
                className="mt-10"
              />
            )}
          </>
        )}

        <div className="mt-12 border-t border-border-subtle pt-6">
          <Link
            href="/blog/rss.xml"
            className="inline-flex items-center gap-2 text-body-sm font-semibold text-text-secondary transition-colors duration-200 hover:text-accent"
          >
            <Rss className="size-4" aria-hidden="true" />
            Subscribe via RSS
          </Link>
        </div>
      </Section>

      <Footer />
    </main>
  )
}
