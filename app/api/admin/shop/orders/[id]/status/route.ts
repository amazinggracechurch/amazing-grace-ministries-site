import { z } from 'zod'
import { adminGuard } from '@/lib/admin/guard'
import { setOrderStatus } from '@/lib/shop'

/**
 * Order status transitions (paid → ready → collected, plus cancel/refund).
 * POST only, admin-only; setOrderStatus validates the transition and
 * records the audit entry.
 */
const statusSchema = z.object({
  status: z.enum(['paid', 'ready', 'collected', 'refunded', 'cancelled']),
})

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
  const parsed = statusSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid status.' }, { status: 400 })
  }

  try {
    const order = await setOrderStatus(id, parsed.data.status, {
      uid: guard.user.uid,
      email: guard.user.email,
    })
    if (!order) {
      return Response.json({ error: 'Order not found.' }, { status: 404 })
    }
    return Response.json({ ok: true, status: order.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    console.error('[admin/shop] status transition failed', { id, message })
    return Response.json(
      { error: message.startsWith('Illegal order status transition') ? message : 'Could not update the order.' },
      { status: 409 }
    )
  }
}
