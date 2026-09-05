import { adminDb } from '@/lib/firebase/admin'
import { recordAudit } from '@/lib/audit'
import { adminGuard } from '@/lib/admin/guard'
import { productInputSchema } from '@/lib/admin/shop-schema'

/**
 * Create a shop product. POST only, admin-only, audited.
 * Stock starts exactly as entered — it only moves through orders (webhook
 * transaction) and later admin edits.
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

  const parsed = productInputSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid product details.' },
      { status: 400 }
    )
  }

  try {
    const db = adminDb()
    // Slugs must be unique — they route the public /shop/[slug] pages.
    const existing = await db
      .collection('products')
      .where('slug', '==', parsed.data.slug)
      .limit(1)
      .get()
    if (!existing.empty) {
      return Response.json({ error: 'That slug is already in use.' }, { status: 409 })
    }

    const ref = await db.collection('products').add({
      ...parsed.data,
      createdAt: new Date().toISOString(),
    })

    await recordAudit({
      actorUid: guard.user.uid,
      actorEmail: guard.user.email,
      action: 'create',
      collection: 'products',
      docId: ref.id,
      after: parsed.data,
    })

    return Response.json({ ok: true, id: ref.id })
  } catch (error) {
    console.error('[admin/shop] create failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.json({ error: 'Could not save the product. Please try again.' }, { status: 500 })
  }
}
