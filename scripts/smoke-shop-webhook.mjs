// One-off E2E: POST a correctly-signed synthetic checkout.session.completed
// (type 'merch') to the local webhook, then verify the order was created,
// stock decremented, the pending order consumed, and a replay acknowledged
// as a duplicate. Cleans up every document it creates.
// Run (dev server up): node --env-file=.env.local scripts/smoke-shop-webhook.mjs
import Stripe from 'stripe'
import { cert, initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    })
const db = getFirestore(app)

const RUN = `smoke-${Date.now()}`
const sessionId = `cs_test_${RUN}`

// Fixture: throwaway product (stock 5) + pending order (qty 2).
const productRef = await db.collection('products').add({
  title: 'Webhook Smoke Product',
  slug: `webhook-smoke-${RUN}`,
  description: 'Throwaway — deleted by the smoke script.',
  images: [],
  priceCents: 100,
  category: 'Test',
  variants: [{ id: 'v-one', name: 'One size', sku: 'SMOKE-1', stock: 5 }],
  fulfillmentMethod: 'pickup',
  status: 'active',
  featured: false,
  createdAt: new Date().toISOString(),
})
const pendingRef = await db.collection('pending_orders').add({
  email: 'smoke-shop@example.com',
  userId: null,
  items: [
    {
      productId: productRef.id,
      variantId: 'v-one',
      title: 'Webhook Smoke Product — One size',
      qty: 2,
      priceCents: 100,
    },
  ],
  subtotalCents: 200,
  taxCents: 0,
  totalCents: 200,
  stripeSessionId: sessionId,
  consumed: false,
  createdAt: new Date().toISOString(),
})

const eventId = `evt_${RUN}`
const payload = JSON.stringify({
  id: eventId,
  object: 'event',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: sessionId,
      object: 'checkout.session',
      metadata: { type: 'merch', pendingOrderId: pendingRef.id, email: 'smoke-shop@example.com' },
    },
  },
})
const header = stripe.webhooks.generateTestHeaderString({
  payload,
  secret: process.env.STRIPE_WEBHOOK_SECRET,
})

const post = () =>
  fetch('http://localhost:3000/api/stripe/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': header },
    body: payload,
  })

const res = await post()
console.log('webhook status:', res.status, await res.text())
const replay = await post()
console.log('replay status:', replay.status, await replay.text())

// Verify.
const orders = await db.collection('orders').where('stripeSessionId', '==', sessionId).get()
const pending = await pendingRef.get()
const product = await productRef.get()
const stock = product.data().variants[0].stock
console.log('orders created:', orders.size)
console.log('pending consumed:', pending.data().consumed)
console.log('stock after (expect 3):', stock)

// Cleanup.
const batch = db.batch()
for (const order of orders.docs) batch.delete(order.ref)
batch.delete(productRef)
batch.delete(pendingRef)
batch.delete(db.collection('stripe_events').doc(eventId))
await batch.commit()
console.log('cleanup done')

if (res.status !== 200 || orders.size !== 1 || pending.data().consumed !== true || stock !== 3) {
  console.error('SMOKE FAILED')
  process.exit(1)
}
console.log('SMOKE PASSED')
process.exit(0)
