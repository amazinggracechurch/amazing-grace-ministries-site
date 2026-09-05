import { getSessionUser } from '@/lib/auth/session'
import { adminDb } from '@/lib/firebase/admin'
import { has } from '@/lib/env'
import { getStripe } from '@/lib/stripe'

/**
 * GET /account/giving/receipt/<paymentIntentId>
 *
 * Redirects to the gift's Stripe-hosted receipt. The receipt URL is fetched
 * lazily (never stored) and only after ownership is proven: a donation with
 * this PaymentIntent must belong to the signed-in member — by userId or by
 * matching donor email. Anything else is a plain 404, so the route can't be
 * used to probe for other people's PaymentIntent ids.
 */

export const runtime = 'nodejs'

const PAYMENT_INTENT_ID = /^pi_[A-Za-z0-9]+$/

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

async function ownsPaymentIntent(uid: string, email: string | null, paymentIntentId: string) {
  const snapshot = await adminDb()
    .collection('donations')
    .where('paymentIntentId', '==', paymentIntentId)
    .limit(5)
    .get()
  return snapshot.docs.some((doc) => {
    if (doc.get('userId') === uid) return true
    const donorEmail = doc.get('donorEmail')
    return email !== null && donorEmail === email
  })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ paymentIntentId: string }> }
) {
  const user = await getSessionUser()
  if (!user) {
    return errorResponse('Please sign in to view your receipt.', 401)
  }

  const { paymentIntentId } = await params
  if (!PAYMENT_INTENT_ID.test(paymentIntentId)) {
    return errorResponse('Receipt not found.', 404)
  }

  if (!has.stripe()) {
    return errorResponse('Receipts are not available right now.', 503)
  }

  try {
    if (!(await ownsPaymentIntent(user.uid, user.email, paymentIntentId))) {
      return errorResponse('Receipt not found.', 404)
    }

    const stripe = getStripe()
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge'],
    })
    const latestCharge = paymentIntent.latest_charge
    const charge =
      typeof latestCharge === 'string'
        ? await stripe.charges.retrieve(latestCharge)
        : latestCharge
    const receiptUrl = charge && typeof charge === 'object' ? charge.receipt_url : null
    if (!receiptUrl) {
      return errorResponse('Receipt not found.', 404)
    }
    return Response.redirect(receiptUrl, 302)
  } catch (error) {
    console.error('[account] receipt lookup failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return errorResponse('Something went wrong fetching your receipt. Please try again.', 500)
  }
}
