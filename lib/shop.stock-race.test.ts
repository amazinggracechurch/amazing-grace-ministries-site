/**
 * Stock-race verification (spec §8): two concurrent paid checkout sessions
 * for the LAST unit of a variant must not both become orders. Runs against
 * the real Firestore (test project) with a throwaway product; exactly one
 * createOrderFromStripeSession call may succeed, the other must throw
 * OrderStockError, and final stock must be 0 — never negative.
 *
 * Run (env loaded from .env.local):
 *   node --env-file=.env.local node_modules/vitest/dist/cli.js run lib/shop.stock-race.test.ts
 */
import { afterAll, describe, expect, it, vi } from 'vitest'

// lib/shop.ts is server-only; vitest is not an RSC environment, so stub the
// marker package before the module graph loads.
vi.mock('server-only', () => ({}))

const { adminDb } = await import('@/lib/firebase/admin')
const { createOrderFromStripeSession, OrderStockError } = await import('@/lib/shop')
const { has } = await import('@/lib/env')

// Integration test against the real Firestore — skips when the Firebase
// Admin env isn't present (e.g. CI without secrets).
const RUN = `race-${Date.now()}`

async function seedRaceFixture(): Promise<{ productId: string; pendingIds: string[] }> {
  const db = adminDb()
  const productRef = await db.collection('products').add({
    title: 'Race Test Product',
    slug: `race-test-${RUN}`,
    description: 'Throwaway product for the stock-race test.',
    images: [],
    priceCents: 100,
    category: 'Test',
    variants: [{ id: 'v-one', name: 'One size', sku: 'RACE-1', stock: 1 }],
    fulfillmentMethod: 'pickup',
    status: 'active',
    featured: false,
    createdAt: new Date().toISOString(),
  })

  const pendingIds: string[] = []
  for (const n of [1, 2]) {
    const ref = await db.collection('pending_orders').add({
      email: `race-test-${n}@example.com`,
      userId: null,
      items: [
        {
          productId: productRef.id,
          variantId: 'v-one',
          title: 'Race Test Product — One size',
          qty: 1,
          priceCents: 100,
        },
      ],
      subtotalCents: 100,
      taxCents: 0,
      totalCents: 100,
      stripeSessionId: null,
      consumed: false,
      createdAt: new Date().toISOString(),
    })
    pendingIds.push(ref.id)
  }
  return { productId: productRef.id, pendingIds }
}

describe.skipIf(!has.firebaseAdmin())('createOrderFromStripeSession stock race', () => {
  it('two concurrent sessions for stock 1 — exactly one order, stock never negative', async () => {
    const { productId, pendingIds } = await seedRaceFixture()
    const db = adminDb()

    const results = await Promise.allSettled(
      pendingIds.map((pendingOrderId, index) =>
        createOrderFromStripeSession({
          id: `cs_test_race_${RUN}_${index}`,
          metadata: { type: 'merch', pendingOrderId },
        })
      )
    )

    const succeeded = results.filter((r) => r.status === 'fulfilled')
    const failed = results.filter((r) => r.status === 'rejected')

    expect(succeeded).toHaveLength(1)
    expect(failed).toHaveLength(1)
    expect((failed[0] as PromiseRejectedResult).reason).toBeInstanceOf(OrderStockError)

    const product = await db.collection('products').doc(productId).get()
    const stock = (product.data()!.variants as { stock: number }[])[0]!.stock
    expect(stock).toBe(0)

    const allOrders = await db.collection('orders').get()
    const raceOrders = allOrders.docs.filter((doc) =>
      String(doc.data().stripeSessionId ?? '').startsWith(`cs_test_race_${RUN}`)
    )
    expect(raceOrders).toHaveLength(1)

    // Cleanup: throwaway product, pending orders, and the one created order.
    const batch = db.batch()
    batch.delete(db.collection('products').doc(productId))
    for (const pendingId of pendingIds) batch.delete(db.collection('pending_orders').doc(pendingId))
    for (const order of raceOrders) batch.delete(order.ref)
    await batch.commit()
  }, 30000)
})

afterAll(async () => {
  // Let the Admin SDK's gRPC handles close so vitest can exit.
  await adminDb().terminate()
})
