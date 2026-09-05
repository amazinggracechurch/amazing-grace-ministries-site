import 'server-only'
import { z } from 'zod'
import { adminDb } from '@/lib/firebase/admin'
import { has } from '@/lib/env'
import { parseBlocks, type Block } from '@/lib/posts/blocks'

/**
 * Server-only data access for the blog / sermon-texts feature (spec §9).
 *
 * All reads go through the Admin SDK (Firestore rules deny client reads
 * of anything but published posts; the Admin SDK bypasses rules). The
 * base query filters on `status` only — a single-field predicate that
 * needs no composite index — and every other filter (type, series,
 * speaker, tag, search, publishAt cutoff, pagination) is applied in
 * memory on the server. At a church-blog scale (hundreds of posts) this
 * is deliberately simpler than maintaining an index matrix.
 */

const authorSchema = z.object({
  name: z.string().min(1),
  avatarUrl: z.string().optional(),
})

const postDocSchema = z.object({
  type: z.union([z.literal('sermon'), z.literal('announcement')]),
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string(),
  body: z.unknown(),
  coverImage: z.string().nullable().optional(),
  author: authorSchema,
  speaker: z.string().optional(),
  scriptureRef: z.string().optional(),
  series: z.string().optional(),
  youtubeId: z.string().optional(),
  audioUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.union([z.literal('draft'), z.literal('published'), z.literal('scheduled')]),
  publishAt: z.string().min(1),
  seo: z
    .object({
      description: z.string().optional(),
      ogImage: z.string().optional(),
    })
    .optional(),
})

export type Post = Omit<z.infer<typeof postDocSchema>, 'body' | 'coverImage' | 'tags'> & {
  id: string
  body: Block[]
  coverImage: string | null
  tags: string[]
}

export type ListPostsOptions = {
  type?: 'sermon' | 'announcement'
  series?: string
  speaker?: string
  tag?: string
  /** Case-insensitive substring search across title + excerpt. */
  query?: string
  /** 1-based. */
  page?: number
  pageSize?: number
}

export type ListPostsResult = {
  posts: Post[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** Parse a Firestore doc into a Post; null when the doc is malformed. */
function toPost(id: string, data: Record<string, unknown>): Post | null {
  const result = postDocSchema.safeParse(data)
  if (!result.success) return null
  const body = parseBlocks(result.data.body)
  if (body === null) return null
  return {
    ...result.data,
    id,
    body,
    coverImage: result.data.coverImage ?? null,
    tags: result.data.tags ?? [],
  }
}

function isVisible(post: Post, now: Date): boolean {
  if (post.status !== 'published') return false
  const publishAt = new Date(post.publishAt)
  if (Number.isNaN(publishAt.getTime())) return false
  return publishAt.getTime() <= now.getTime()
}

function byPublishAtDesc(a: Post, b: Post): number {
  return new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime()
}

/** Every published post past its publishAt, newest first. */
async function fetchPublishedPosts(): Promise<Post[]> {
  // Graceful when Firebase Admin isn't configured (e.g. a fresh Vercel
  // project before env vars are set) — the blog renders its empty state
  // instead of failing the build/request.
  if (!has.firebaseAdmin()) return []
  try {
    const snapshot = await adminDb()
      .collection('posts')
      .where('status', '==', 'published')
      .get()
    const now = new Date()
    return snapshot.docs
      .map((doc) => toPost(doc.id, doc.data()))
      .filter((post): post is Post => post !== null && isVisible(post, now))
      .sort(byPublishAtDesc)
  } catch (error) {
    console.warn('[posts] fetch failed, rendering empty state', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return []
  }
}

export async function listPublishedPosts(options: ListPostsOptions = {}): Promise<ListPostsResult> {
  const pageSize = Math.max(1, options.pageSize ?? 10)
  const requestedPage = Math.max(1, options.page ?? 1)
  const query = options.query?.trim().toLowerCase() ?? ''

  let posts = await fetchPublishedPosts()
  if (options.type) posts = posts.filter((p) => p.type === options.type)
  if (options.series) posts = posts.filter((p) => p.series === options.series)
  if (options.speaker) posts = posts.filter((p) => p.speaker === options.speaker)
  if (options.tag) posts = posts.filter((p) => p.tags.includes(options.tag as string))
  if (query) {
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(query) || p.excerpt.toLowerCase().includes(query)
    )
  }

  const total = posts.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(requestedPage, totalPages)
  return {
    posts: posts.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pageSize,
    totalPages,
  }
}

/** A published, live post by slug — null for unknown, draft, or scheduled slugs. */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const snapshot = await adminDb()
    .collection('posts')
    .where('slug', '==', slug)
    .limit(1)
    .get()
  const doc = snapshot.docs[0]
  if (!doc) return null
  const post = toPost(doc.id, doc.data())
  if (!post || !isVisible(post, new Date())) return null
  return post
}

/**
 * Immediate neighbours in the published timeline. `prev` is the older
 * post, `next` the newer one — reading chronologically.
 */
export async function getAdjacentPosts(
  post: Post
): Promise<{ prev: Post | null; next: Post | null }> {
  const posts = await fetchPublishedPosts()
  const index = posts.findIndex((p) => p.id === post.id)
  if (index === -1) return { prev: null, next: null }
  return {
    prev: posts[index + 1] ?? null,
    next: posts[index - 1] ?? null,
  }
}

/** Same series first, then posts sharing tags — excluding the post itself. */
export async function getRelatedPosts(post: Post, count: number): Promise<Post[]> {
  const posts = await fetchPublishedPosts().then((all) => all.filter((p) => p.id !== post.id))
  const sameSeries = post.series ? posts.filter((p) => p.series === post.series) : []
  const sharedTags = posts.filter(
    (p) => p.series !== post.series && p.tags.some((tag) => post.tags.includes(tag))
  )
  return [...sameSeries, ...sharedTags].slice(0, count)
}

/** Rough read time at 200 wpm across all text-bearing blocks. */
export function readingTimeMinutes(blocks: Block[]): number {
  const words = blocks
    .map((block) => {
      switch (block.type) {
        case 'paragraph':
        case 'heading':
        case 'scripture':
        case 'pullquote':
          return block.text
        case 'list':
          return block.items.join(' ')
        case 'image':
          return block.caption ?? ''
      }
    })
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

/** Distinct series names among published posts, alphabetized. */
export async function listSeries(): Promise<string[]> {
  const posts = await fetchPublishedPosts()
  const series = new Set(
    posts.map((p) => p.series).filter((s): s is string => typeof s === 'string' && s.length > 0)
  )
  return [...series].sort((a, b) => a.localeCompare(b))
}

/** Distinct speakers among published posts, alphabetized. */
export async function listSpeakers(): Promise<string[]> {
  const posts = await fetchPublishedPosts()
  const speakers = new Set(
    posts.map((p) => p.speaker).filter((s): s is string => typeof s === 'string' && s.length > 0)
  )
  return [...speakers].sort((a, b) => a.localeCompare(b))
}
