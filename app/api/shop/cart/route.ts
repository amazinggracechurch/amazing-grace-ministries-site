import { z } from 'zod'
import { adminDb } from '@/lib/firebase/admin'
import { getSessionUser } from '@/lib/auth/session'

/**
 * Server-side cart for signed-in members — carts/{uid}. GET returns the
 * stored snapshot, PUT replaces it. The localStorage cart remains the
 * fallback and merges with this on sign-in (see CartProvider). Prices and
 * stock are never trusted from here — checkout re-validates everything.
 */

const cartItemSchema = z.object({
  productId: z.string().min(1).max(200),
  variantId: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  variantName: z.string().max(80),
  slug: z.string().max(200),
  image: z.string().max(2000).nullable(),
  priceCents: z.number().int().min(0).max(10000000),
  qty: z.number().int().min(1).max(20),
  maxStock: z.number().int().min(0).max(100000),
})

const cartSchema = z.object({
  items: z.array(cartItemSchema).max(50),
  updatedAt: z.string().max(40),
})

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: 'Sign in required.' }, { status: 401 })
  }
  const snapshot = await adminDb().collection('carts').doc(user.uid).get()
  if (!snapshot.exists) {
    return Response.json({ items: [], updatedAt: new Date(0).toISOString() })
  }
  const data = snapshot.data()!
  return Response.json({
    items: Array.isArray(data.items) ? data.items : [],
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date(0).toISOString(),
  })
}

export async function PUT(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: 'Sign in required.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  const parsed = cartSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid cart.' }, { status: 400 })
  }

  await adminDb().collection('carts').doc(user.uid).set({
    uid: user.uid,
    items: parsed.data.items,
    updatedAt: parsed.data.updatedAt,
  })
  return Response.json({ ok: true })
}
