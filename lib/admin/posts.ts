import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import { parseBlocks, type Block } from '@/lib/posts/blocks'

/**
 * Admin-side post reads. lib/posts/index.ts only exposes published posts;
 * the admin needs drafts and scheduled posts too, plus lookup by id.
 * Kept separate so the public data layer stays untouched.
 */

export type AdminPost = {
  id: string
  type: 'sermon' | 'announcement'
  title: string
  slug: string
  excerpt: string
  body: Block[]
  coverImage: string | null
  authorName: string
  speaker: string
  scriptureRef: string
  series: string
  tags: string[]
  status: 'draft' | 'published' | 'scheduled'
  publishAt: string
  seoDescription: string
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function toAdminPost(id: string, data: Record<string, unknown>): AdminPost | null {
  const title = asString(data.title)
  const slug = asString(data.slug)
  const type = asString(data.type)
  if (!title || !slug || (type !== 'sermon' && type !== 'announcement')) return null
  const body = parseBlocks(data.body) ?? []

  const author =
    typeof data.author === 'object' && data.author !== null
      ? (data.author as Record<string, unknown>)
      : {}
  const seo =
    typeof data.seo === 'object' && data.seo !== null
      ? (data.seo as Record<string, unknown>)
      : {}
  const status = asString(data.status)

  return {
    id,
    type,
    title,
    slug,
    excerpt: asString(data.excerpt) ?? '',
    body,
    coverImage: asString(data.coverImage),
    authorName: asString(author.name) ?? '',
    speaker: asString(data.speaker) ?? '',
    scriptureRef: asString(data.scriptureRef) ?? '',
    series: asString(data.series) ?? '',
    tags: Array.isArray(data.tags)
      ? data.tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    status: status === 'published' || status === 'scheduled' ? status : 'draft',
    publishAt: asString(data.publishAt) ?? new Date().toISOString(),
    seoDescription: asString(seo.description) ?? '',
  }
}

/** Every post regardless of status, newest publishAt first. */
export async function listAllPosts(): Promise<AdminPost[]> {
  const snapshot = await adminDb().collection('posts').get()
  return snapshot.docs
    .map((doc) => toAdminPost(doc.id, doc.data()))
    .filter((post): post is AdminPost => post !== null)
    .sort((a, b) => b.publishAt.localeCompare(a.publishAt))
}

export async function getPostById(id: string): Promise<AdminPost | null> {
  const doc = await adminDb().collection('posts').doc(id).get()
  return doc.exists ? toAdminPost(doc.id, doc.data()!) : null
}
