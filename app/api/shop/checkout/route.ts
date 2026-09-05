import { z } from 'zod'
import { has } from '@/lib/env'
import { env } from '@/lib/env'
import { getStripe } from '@/lib/stripe'
import { getSessionUser } from '@/lib/auth/session'
import { attachSessionToPendingOrder, createPendingOrder, getProductById, type OrderItem } from '@/lib/shop'

/**
 * Merch checkout: validates the cart, stashes a pending_orders doc, and
 * creates a Stripe Checkout Session (mode: payment). POST only.
 *
 * The order document is NOT written here — it is created by the Stripe
 * webhook on `checkout.session.completed` (metadata.type === 'merch'),
 * which decrements stock in a single transaction. Stock is VALIDATED here
 * (qty <= current stock) but NOT reserved — the webhook transaction is the
 * only stock mutation, so a customer who abandons checkout never holds
 * inventory. The cart travels via pending_orders/{id} rather than session
 * metadata because Stripe metadata values are capped at 500 characters.
 *
 * Tax: taxCents is always 0 — pickup sales are handled as tax-exempt by
 * the church (see lib/shop.ts). No shipping: fulfillment is pickup only.
 */

const checkoutItemSchema = z.object({
  productId: z.string().trim().min(1).max(200),
  variantId: z.string().trim().min(1).max(200),
  qty: z.number().int().min(1).max(20),
})

const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, 'Your cart is empty.').max(50),
  email: z.email('Please enter a valid email address.').max(320).optional(),
})

export async function POST(request: Request) {
  if (!has.stripe()) {
    return Response.json(
      { error: 'Online payment is not available yet. Please contact the church to order.' },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid cart.' },
      { status: 400 }
    )
  }

  // Optional — a signed-in member gets their order attached to their account.
  const user = await getSessionUser().catch(() => null)
  const email = parsed.data.email ?? user?.email ?? null
  if (!email) {
    return Response.json({ error: 'Please enter your email address.' }, { status: 400 })
  }

  // Validate every item against live products; snapshot titles/prices.
  // Nothing is decremented here — the webhook transaction owns stock.
  const items: OrderItem[] = []
  for (const requested of parsed.data.items) {
    const product = await getProductById(requested.productId).catch(() => null)
    if (!product || product.status !== 'active') {
      return Response.json({ error: 'A product in your cart is no longer available.' }, { status: 409 })
    }
    const variant = product.variants.find((candidate) => candidate.id === requested.variantId)
    if (!variant) {
      return Response.json(
        { error: `A variant of "${product.title}" is no longer available.` },
        { status: 409 }
      )
    }
    if (variant.stock < requested.qty) {
      return Response.json(
        {
          error:
            variant.stock === 0
              ? `"${product.title} — ${variant.name}" is sold out.`
              : `Only ${variant.stock} left of "${product.title} — ${variant.name}".`,
        },
        { status: 409 }
      )
    }
    const priceCents = variant.priceCents ?? product.priceCents
    items.push({
      productId: product.id,
      variantId: variant.id,
      title: `${product.title} — ${variant.name}`,
      qty: requested.qty,
      priceCents,
    })
  }

  const subtotalCents = items.reduce((sum, item) => sum + item.priceCents * item.qty, 0)
  const taxCents = 0 // pickup, tax-exempt — see lib/shop.ts
  const totalCents = subtotalCents + taxCents

  try {
    const pendingOrderId = await createPendingOrder({
      email,
      userId: user?.uid ?? null,
      items,
      subtotalCents,
      taxCents,
      totalCents,
    })

    const base = env.siteUrl()
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: items.map((item) => ({
        quantity: item.qty,
        price_data: {
          currency: 'usd',
          unit_amount: item.priceCents,
          product_data: { name: item.title },
        },
      })),
      metadata: {
        type: 'merch',
        pendingOrderId,
        email,
      },
      // 30 minutes — Stripe's minimum; keeps stale carts from lingering.
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${base}/shop/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/shop/cart`,
    })
    if (!session.url) {
      return Response.json({ error: 'Could not start checkout. Please try again.' }, { status: 502 })
    }
    await attachSessionToPendingOrder(pendingOrderId, session.id)
    return Response.json({ url: session.url })
  } catch (error) {
    console.error('[shop checkout] session creation failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.json({ error: 'Could not start checkout. Please try again.' }, { status: 502 })
  }
}
