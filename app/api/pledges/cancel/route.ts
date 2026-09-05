import { z } from 'zod'
import { getSessionUser } from '@/lib/auth/session'
import { cancelPledge, PledgeError } from '@/lib/pledges'

/**
 * Cancels the signed-in member's own pledge. POST only.
 * Ownership is enforced inside cancelPledge's transaction — the id in the
 * body is never trusted on its own.
 */

const cancelSchema = z.object({
  pledgeId: z.string().trim().min(1).max(200),
})

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return errorResponse('Please sign in to manage your pledges.', 401)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid request body.', 400)
  }

  const parsed = cancelSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Invalid request.', 400)
  }

  try {
    await cancelPledge(parsed.data.pledgeId, user.uid)
    return Response.json({ ok: true })
  } catch (error) {
    if (error instanceof PledgeError) {
      const status =
        error.code === 'pledge_not_found' ? 404 : error.code === 'forbidden' ? 403 : 409
      return errorResponse(error.message, status)
    }
    console.error('[pledges] cancel failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return errorResponse('Something went wrong cancelling your pledge. Please try again.', 500)
  }
}
