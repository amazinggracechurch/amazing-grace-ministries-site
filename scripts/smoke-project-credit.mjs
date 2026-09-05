// One-off: verify the webhook credits project progress end-to-end.
// Creates a test project, sends a signed payment_intent.succeeded with
// projectId metadata, checks raisedAmountCents/donorCount, then cleans up.
// Run (dev server up): node --env-file=.env.local scripts/smoke-project-credit.mjs
import Stripe from 'stripe'
import { cert, initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

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

// 1. Create a test project
const projectRef = await db.collection('projects').add({
  title: 'SMOKE — delete me',
  slug: 'smoke-credit-test',
  description: 'temporary',
  coverImage: null,
  goalAmountCents: 10000,
  raisedAmountCents: 0,
  pledgedAmountCents: 0,
  donorCount: 0,
  startDate: new Date().toISOString(),
  endDate: null,
  status: 'active',
  featured: false,
  sortOrder: 99,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
})
console.log('project created:', projectRef.id)

// 2. Signed synthetic webhook with projectId metadata
const eventId = 'evt_smoke_proj_' + Date.now()
const payload = JSON.stringify({
  id: eventId,
  object: 'event',
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_smoke_proj_' + Date.now(),
      object: 'payment_intent',
      amount: 2606,
      payment_method_types: ['card'],
      metadata: {
        fund: 'Offering',
        frequency: 'one-time',
        donorEmail: 'smoke-donor@example.com',
        coveredFee: 'true',
        source: 'web',
        baseAmountCents: '2500',
        feeCents: '106',
        projectId: projectRef.id,
        projectSlug: 'smoke-credit-test',
      },
    },
  },
})
const header = stripe.webhooks.generateTestHeaderString({
  payload,
  secret: process.env.STRIPE_WEBHOOK_SECRET,
})
const res = await fetch('http://localhost:3000/api/stripe/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'stripe-signature': header },
  body: payload,
})
console.log('webhook status:', res.status, await res.text())

// 3. Verify
const after = await projectRef.get()
const data = after.data()
console.log('raisedAmountCents:', data.raisedAmountCents, '(expect 2500)')
console.log('donorCount:', data.donorCount, '(expect 1)')
const donors = await projectRef.collection('donors').get()
console.log('donor docs:', donors.size, '(expect 1)')
const donations = await db
  .collection('donations')
  .where('donorEmail', '==', 'smoke-donor@example.com')
  .get()
console.log('donation docs:', donations.size, 'projectId:', donations.docs[0]?.get('projectId') === projectRef.id, 'method:', donations.docs[0]?.get('method'))

// 4. Cleanup
for (const d of donors.docs) await d.ref.delete()
for (const d of donations.docs) await d.ref.delete()
await db.collection('stripe_events').doc(eventId).delete()
await projectRef.delete()
console.log('cleanup done')
process.exit(0)
