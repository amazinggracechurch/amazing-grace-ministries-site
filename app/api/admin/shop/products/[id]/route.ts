import { adminDb } from '@/lib/firebase/admin'
import { recordAudit } from '@/lib/audit'
import { adminGuard } from '@/lib/admin/guard'
import { productInputSchema } from '@/lib/admin/shop-schema'
import { getProductById } from '@/lib/shop'

/**
 * Update a shop product. POST only, admin-only, audited.
 * Variant stock IS writable here (admin recount), unlike order-created
 * stock decrements which only happen in the webhook transaction.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await adminGuard()
  if (!guard.ok) return guard.response

  const { id } = await params

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
    const before = await getProductById(id)
    if (!before) {
      return Response.json({ error: 'Product not found.' }, { status: 404 })
    }

    const db = adminDb()
    if (parsed.data.slug !== before.slug) {
      const existing = await db
        .collection('products')
        .where('slug', '==', parsed.data.slug)
        .limit(1)
        .get()
      if (!existing.empty && existing.docs[0]!.id !== id) {
        return Response.json({ error: 'That slug is already in use.' }, { status: 409 })
      }
    }

    await db.collection('products').doc(id).update({ ...parsed.data })

    await recordAudit({
      actorUid: guard.user.uid,
      actorEmail: guard.user.email,
      action: 'update',
      collection: 'products',
      docId: id,
      before,
      after: parsed.data,
    })

    return Response.json({ ok: true, id })
  } catch (error) {
    console.error('[admin/shop] update failed', {
      id,
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.json({ error: 'Could not save the product. Please try again.' }, { status: 500 })
  }
}
