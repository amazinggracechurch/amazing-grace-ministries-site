import { z } from 'zod'
import { env, has } from '@/lib/env'
import { getEventById } from '@/lib/events'
import { getStripe } from '@/lib/stripe'

/**
 * Ticketed-event RSVP: creates a Stripe Checkout Session (mode: payment).
 * POST only.
 *
 * The RSVP document is NOT written here — it is created by the Stripe
 * webhook on `checkout.session.completed`, keyed off the session metadata
 * ({type:'rsvp', eventId, name, email, partySize}). Capacity is re-checked
 * there; a paid RSVP that arrives after sell-out lands on the waitlist
 * rather than silently overselling.
 */

const checkoutSchema = z.object({
  eventId: z.string().trim().min(1).max(200),
  name: z.string().trim().min(1, 'Please enter your name.').max(100),
  email: z.email('Please enter a valid email address.').max(320),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  partySize: z.number().int().min(1).max(10),
  website: z.string().max(200).optional(),
})

export async function POST(request: Request) {
  if (!has.stripe()) {
    return Response.json(
      { error: 'Online payment is not available yet. Please contact the church to RSVP.' },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  // Honeypot — pretend success, do nothing.
  if (
    typeof body === 'object' &&
    body !== null &&
    'website' in body &&
    typeof (body as Record<string, unknown>).website === 'string' &&
    ((body as Record<string, unknown>).website as string).trim() !== ''
  ) {
    return Response.json({ ok: true })
  }

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid RSVP details.' },
      { status: 400 }
    )
  }

  const { eventId, name, email, phone, partySize } = parsed.data

  let event
  try {
    event = await getEventById(eventId)
  } catch (error) {
    console.error('[rsvps checkout] event lookup failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
  if (!event || event.status !== 'published') {
    return Response.json({ error: 'This event could not be found.' }, { status: 404 })
  }
  if (!event.priceCents || event.priceCents <= 0) {
    return Response.json({ error: 'This event is free — use the RSVP form.' }, { status: 400 })
  }
  if (event.capacity !== null && event.capacity - event.rsvpCount < partySize) {
    return Response.json(
      { error: 'Not enough spots left for that party size.' },
      { status: 409 }
    )
  }

  const base = env.siteUrl()
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          quantity: partySize,
          price_data: {
            currency: 'usd',
            unit_amount: event.priceCents,
            product_data: {
              name: `${event.title} — RSVP`,
              description: event.location.name || undefined,
            },
          },
        },
      ],
      metadata: {
        type: 'rsvp',
        eventId: event.id,
        name,
        email,
        phone: phone || '',
        partySize: String(partySize),
      },
      success_url: `${base}/events/${event.slug}?paid=1`,
      cancel_url: `${base}/events/${event.slug}`,
    })
    if (!session.url) {
      return Response.json({ error: 'Could not start checkout. Please try again.' }, { status: 502 })
    }
    return Response.json({ url: session.url })
  } catch (error) {
    console.error('[rsvps checkout] session creation failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.json({ error: 'Could not start checkout. Please try again.' }, { status: 502 })
  }
}
