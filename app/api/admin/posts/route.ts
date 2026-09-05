import { adminDb } from '@/lib/firebase/admin'
import { recordAudit } from '@/lib/audit'
import { adminGuard } from '@/lib/admin/guard'
import { postInputSchema } from '@/lib/admin/posts-schema'
import { churchLocalToIso } from '@/lib/admin/chicago-time'
import { getPostById } from '@/lib/admin/posts'

/**
 * Create or update a blog post / sermon text. POST only, admin-only,
 * audited. When the body carries `id` it's an update, otherwise a create.
 * The whole payload is validated with the block schema, so no raw HTML or
 * malformed block ever reaches Firestore.
 */
export async function POST(request: Request) {
  const guard = await adminGuard()
  if (!guard.ok) return guard.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = postInputSchema.safeParse(body)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const where = issue && issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''
    return Response.json(
      { error: `${where}${issue?.message ?? 'Invalid post.'}` },
      { status: 400 }
    )
  }
  const input = parsed.data

  const publishAt = churchLocalToIso(input.publishAt)
  if (!publishAt) {
    return Response.json({ error: 'Publish date/time is not valid.' }, { status: 400 })
  }

  const record = {
    type: input.type,
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    body: input.body,
    coverImage: input.coverImage,
    author: { name: input.authorName },
    ...(input.speaker ? { speaker: input.speaker } : {}),
    ...(input.scriptureRef ? { scriptureRef: input.scriptureRef } : {}),
    ...(input.series ? { series: input.series } : {}),
    tags: input.tags,
    status: input.status,
    publishAt,
    ...(input.seoDescription ? { seo: { description: input.seoDescription } } : {}),
  }

  try {
    const db = adminDb()

    const existing = await db
      .collection('posts')
      .where('slug', '==', input.slug)
      .limit(1)
      .get()
    if (!existing.empty && existing.docs[0]!.id !== input.id) {
      return Response.json({ error: 'That slug is already in use.' }, { status: 409 })
    }

    if (input.id) {
      const before = await getPostById(input.id)
      if (!before) {
        return Response.json({ error: 'Post not found.' }, { status: 404 })
      }
      // Merge with the stored doc so fields the editor doesn't manage
      // (youtubeId, audioUrl, createdAt) survive; optionals the editor
      // emptied are removed from the merged object.
      const snap = await db.collection('posts').doc(input.id).get()
      const merged: Record<string, unknown> = { ...(snap.data() ?? {}), ...record }
      if (!input.speaker) delete merged.speaker
      if (!input.scriptureRef) delete merged.scriptureRef
      if (!input.series) delete merged.series
      if (!input.seoDescription && typeof merged.seo === 'object' && merged.seo !== null) {
        delete (merged.seo as Record<string, unknown>).description
      }
      await db.collection('posts').doc(input.id).set(merged)
      await recordAudit({
        actorUid: guard.user.uid,
        actorEmail: guard.user.email,
        action: 'update',
        collection: 'posts',
        docId: input.id,
        before,
        after: record,
      })
      return Response.json({ ok: true, id: input.id })
    }

    const ref = await db.collection('posts').add(record)
    await recordAudit({
      actorUid: guard.user.uid,
      actorEmail: guard.user.email,
      action: 'create',
      collection: 'posts',
      docId: ref.id,
      after: record,
    })
    return Response.json({ ok: true, id: ref.id })
  } catch (error) {
    console.error('[admin/posts] save failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.json({ error: 'Could not save the post. Please try again.' }, { status: 500 })
  }
}
