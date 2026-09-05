import { z } from 'zod'
import { createRsvp, RsvpError, spotsLeft, getEventById } from '@/lib/events'
import { rsvpManageUrl, sendRsvpConfirmationEmail } from '@/lib/rsvp-email'

/**
 * Free-event RSVP endpoint. POST only.
 *
 * - zod-validated body.
 * - Honeypot: a filled `website` field gets a fake 200 and nothing is written.
 * - Naive in-memory per-IP rate limit: 10 RSVPs per hour.
 * - The RSVP is created in a Firestore transaction (see lib/events.ts);
 *   confirmation email with an .ics attachment is best-effort.
 * - Response always includes the signed manage URL so the confirmation state
 *   works even when email is not configured.
 */

const rsvpSchema = z.object({
  eventId: z.string().trim().min(1).max(200),
  name: z.string().trim().min(1, 'Please enter your name.').max(100),
  email: z.email('Please enter a valid email address.').max(320),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  partySize: z.number().int().min(1).max(10),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  website: z.string().max(200).optional(),
})

const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60 * 60 * 1000

type RateEntry = { count: number; resetAt: number }

// Per server instance — intentionally naive; good enough to blunt drive-by abuse.
const globalStore = globalThis as typeof globalThis & {
  __rsvpRateLimit?: Map<string, RateEntry>
}
const hits = (globalStore.__rsvpRateLimit ??= new Map<string, RateEntry>())

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > RATE_LIMIT
}

function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  // Honeypot — pretend success, write nothing.
  if (
    typeof body === 'object' &&
    body !== null &&
    'website' in body &&
    typeof (body as Record<string, unknown>).website === 'string' &&
    ((body as Record<string, unknown>).website as string).trim() !== ''
  ) {
    return Response.json({ ok: true })
  }

  if (isRateLimited(clientIp(request))) {
    return Response.json(
      { error: 'Too many attempts. Please wait a while and try again.' },
      { status: 429 }
    )
  }

  const parsed = rsvpSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid RSVP details.' },
      { status: 400 }
    )
  }

  const { eventId, name, email, phone, partySize, notes } = parsed.data

  try {
    const { rsvp, event } = await createRsvp({
      eventId,
      name,
      email,
      phone: phone || null,
      partySize,
      notes: notes || null,
    })

    const manageUrl = rsvpManageUrl(rsvp.id, rsvp.manageToken)
    // Best-effort — failure must not fail the RSVP.
    await sendRsvpConfirmationEmail({ rsvp, event, manageUrl })

    // Fresh count for the confirmation UI ("N spots left").
    const fresh = await getEventById(event.id).catch(() => null)
    return Response.json({
      ok: true,
      rsvpId: rsvp.id,
      status: rsvp.status,
      manageUrl,
      spotsLeft: fresh ? spotsLeft(fresh) : null,
    })
  } catch (error) {
    if (error instanceof RsvpError) {
      const status = error.code === 'event_not_found' ? 404 : 409
      return Response.json({ error: error.message }, { status })
    }
    console.error('[rsvps] create failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.json(
      { error: 'Something went wrong saving your RSVP. Please try again.' },
      { status: 500 }
    )
  }
}
