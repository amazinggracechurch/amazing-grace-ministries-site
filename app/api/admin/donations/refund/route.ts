import { z } from 'zod'
import { adminDb } from '@/lib/firebase/admin'
import { adminGuard } from '@/lib/admin/guard'
import { recordAudit } from '@/lib/audit'
import { getStripe } from '@/lib/stripe'

/**
 * POST /api/admin/donations/refund { paymentIntentId }
 *
 * Issues a full Stripe refund for a succeeded gift. The ledger entry for the
 * refund is written by the Stripe webhook's `charge.refunded` handler (which
 * records a new donation doc with status 'refunded') — this route must NOT
 * write a donation record, or every refund would be double-counted. What
 * this route DOES write is the audit entry (spec §7.6: non-negotiable for
 * anything touching money).
 */

export const runtime = 'nodejs'

const bodySchema = z.object({
  paymentIntentId: z.string().min(1).max(200),
})

export async function POST(request: Request) {
  const guard = await adminGuard()
  if (!guard.ok) return guard.response

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return Response.json({ error: 'invalid_request' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return Response.json({ error: 'invalid_request' }, { status: 400 })
  }
  const { paymentIntentId } = parsed.data

  const snapshot = await adminDb()
    .collection('donations')
    .where('paymentIntentId', '==', paymentIntentId)
    .get()
  const succeeded = snapshot.docs.find((doc) => doc.get('status') === 'succeeded')
  const alreadyRefunded = snapshot.docs.some((doc) => doc.get('status') === 'refunded')

  if (!succeeded) {
    return Response.json(
      { error: alreadyRefunded ? 'already_refunded' : 'not_found' },
      { status: alreadyRefunded ? 409 : 404 }
    )
  }

  let refundId: string
  try {
    const refund = await getStripe().refunds.create({ payment_intent: paymentIntentId })
    refundId = refund.id
  } catch (error) {
    console.error('[admin refund] stripe.refunds.create failed', {
      paymentIntentId,
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.json({ error: 'refund_failed' }, { status: 502 })
  }

  await recordAudit({
    actorUid: guard.user.uid,
    actorEmail: guard.user.email,
    action: 'refund',
    collection: 'donations',
    docId: succeeded.id,
    before: { status: 'succeeded', amountCents: succeeded.get('amountCents') },
    after: { refundId },
  })

  return Response.json({ ok: true, refundId })
}
