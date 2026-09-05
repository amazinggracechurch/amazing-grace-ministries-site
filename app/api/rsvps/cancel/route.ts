import { z } from 'zod'
import { cancelRsvp, getEventById, RsvpError } from '@/lib/events'
import { verifyRsvpToken } from '@/lib/tokens'
import { rsvpManageUrl, sendRsvpConfirmationEmail } from '@/lib/rsvp-email'

/**
 * Cancels an RSVP given its id + signed manage token (the link emailed on
 * confirmation). POST only. Idempotent — cancelling twice is a no-op.
 * If the cancellation frees seats, the oldest fitting waitlist RSVP is
 * promoted inside the same transaction and emailed a confirmation.
 */

const cancelSchema = z.object({
  id: z.string().trim().min(1).max(200),
  token: z.string().trim().min(1).max(200),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = cancelSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid cancel request.' }, { status: 400 })
  }

  const { id, token } = parsed.data
  if (!verifyRsvpToken(id, token)) {
    return Response.json({ error: 'This link is not valid.' }, { status: 403 })
  }

  try {
    const { promoted } = await cancelRsvp(id)

    // Best-effort: tell the promoted guest their spot opened up.
    if (promoted) {
      const event = await getEventById(promoted.eventId).catch(() => null)
      if (event) {
        const manageUrl = rsvpManageUrl(promoted.id, promoted.manageToken)
        await sendRsvpConfirmationEmail({ rsvp: promoted, event, manageUrl })
      }
    }

    return Response.json({ ok: true, status: 'cancelled', promoted: promoted !== null })
  } catch (error) {
    if (error instanceof RsvpError) {
      return Response.json({ error: error.message }, { status: 404 })
    }
    console.error('[rsvps] cancel failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.json(
      { error: 'Something went wrong cancelling your RSVP. Please try again.' },
      { status: 500 }
    )
  }
}
