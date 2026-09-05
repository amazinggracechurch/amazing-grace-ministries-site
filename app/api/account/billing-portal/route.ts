import { getSessionUser } from '@/lib/auth/session'
import { adminDb } from '@/lib/firebase/admin'
import { env, has } from '@/lib/env'
import { getStripe } from '@/lib/stripe'

/**
 * POST /api/account/billing-portal
 *
 * Creates a Stripe Billing Portal session for the signed-in member and
 * returns its URL. The customer is resolved in order:
 *   1. users/{uid}.stripeCustomerId (written by a previous call),
 *   2. an existing Stripe Customer with the account email,
 *   3. a newly created Customer —
 * and the resolved id is backfilled onto users/{uid} so later calls skip
 * the search. Card edits, pausing, and cancellation all happen inside
 * Stripe's hosted portal (PCI-safe); this site never sees card data.
 */

export const runtime = 'nodejs'

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export async function POST() {
  const user = await getSessionUser()
  if (!user) {
    return errorResponse('Please sign in to manage billing.', 401)
  }
  if (!user.email) {
    return errorResponse('Your account has no email address, so billing cannot be managed online.', 400)
  }
  if (!has.stripe()) {
    return errorResponse('Online billing is not available right now.', 503)
  }

  try {
    const stripe = getStripe()
    const userRef = adminDb().collection('users').doc(user.uid)
    const snapshot = await userRef.get()
    const stored = snapshot.get('stripeCustomerId')

    let customerId = typeof stored === 'string' && stored.length > 0 ? stored : null
    if (!customerId) {
      const existing = await stripe.customers.list({ email: user.email, limit: 1 })
      const customer =
        existing.data[0] ??
        (await stripe.customers.create({
          email: user.email,
          ...(user.name ? { name: user.name } : {}),
          metadata: { firebaseUid: user.uid },
        }))
      customerId = customer.id
      await userRef.set({ stripeCustomerId: customerId }, { merge: true })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${env.siteUrl()}/account/recurring`,
    })
    return Response.json({ url: session.url })
  } catch (error) {
    console.error('[account] billing portal session failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return errorResponse('Something went wrong opening the billing portal. Please try again.', 502)
  }
}
