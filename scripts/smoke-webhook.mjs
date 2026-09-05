// One-off: POST a correctly-signed synthetic payment_intent.succeeded to the
// local webhook, then check the donation landed in Firestore.
// Run (dev server up): node --env-file=.env.local scripts/smoke-webhook.mjs
import Stripe from 'stripe'
import { cert, initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const payload = JSON.stringify({
  id: 'evt_smoke_' + Date.now(),
  object: 'event',
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_smoke_' + Date.now(),
      object: 'payment_intent',
      amount: 5181,
      metadata: {
        fund: 'Missions',
        frequency: 'one-time',
        donorEmail: 'smoke@example.com',
        coveredFee: 'true',
        source: 'web',
        baseAmountCents: '5000',
        feeCents: '181',
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
const donations = await db
  .collection('donations')
  .where('donorEmail', '==', 'smoke@example.com')
  .get()
console.log('donations in Firestore:', donations.size)
const eventId = JSON.parse(payload).id
const eventDoc = await db.collection('stripe_events').doc(eventId).get()
console.log('idempotency doc exists:', eventDoc.exists)
process.exit(0)
