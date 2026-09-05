import { z } from 'zod'
import { adminGuard } from '@/lib/admin/guard'
import { recordAudit } from '@/lib/audit'
import { sendEmail } from '@/lib/email'
import { getEventById } from '@/lib/events'
import { listRsvpsForEvent } from '@/lib/admin/rsvps'

/**
 * Email all confirmed attendees of an event. POST {eventId, subject, body},
 * admin-only, audited. Recipients are BCC-style individual sends through
 * Resend in batches of 50 so a single bad address can't sink the batch.
 */

const emailSchema = z.object({
  eventId: z.string().trim().min(1).max(200),
  subject: z.string().trim().min(1, 'Subject is required.').max(200),
  body: z.string().trim().min(1, 'Body is required.').max(10000),
})

const BATCH_SIZE = 50

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Plain-text body → simple HTML paragraphs/line breaks. */
function bodyToHtml(body: string): string {
  return escapeHtml(body).replace(/\r?\n/g, '<br />')
}

export async function POST(request: Request) {
  const guard = await adminGuard()
  if (!guard.ok) return guard.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = emailSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid email details.' },
      { status: 400 }
    )
  }

  const event = await getEventById(parsed.data.eventId)
  if (!event) {
    return Response.json({ error: 'Event not found.' }, { status: 404 })
  }

  const rsvps = await listRsvpsForEvent(event.id)
  const recipients = [...new Set(
    rsvps
      .filter((rsvp) => rsvp.status === 'confirmed')
      .map((rsvp) => rsvp.email.trim().toLowerCase())
      .filter(Boolean)
  )]

  if (recipients.length === 0) {
    return Response.json({ error: 'This event has no confirmed attendees to email.' }, { status: 400 })
  }

  const html = bodyToHtml(parsed.data.body)
  let sent = 0
  let failed = 0
  for (let index = 0; index < recipients.length; index += BATCH_SIZE) {
    const batch = recipients.slice(index, index + BATCH_SIZE)
    const results = await Promise.all(
      batch.map((to) => sendEmail({ to, subject: parsed.data.subject, html }))
    )
    for (const ok of results) {
      if (ok) sent += 1
      else failed += 1
    }
  }

  await recordAudit({
    actorUid: guard.user.uid,
    actorEmail: guard.user.email,
    action: 'email_attendees',
    collection: 'events',
    docId: event.id,
    after: {
      subject: parsed.data.subject,
      recipients: recipients.length,
      sent,
      failed,
    },
  })

  return Response.json({ ok: true, recipients: recipients.length, sent, failed })
}
