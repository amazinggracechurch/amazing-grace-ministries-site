import 'server-only'
import { sendEmail } from '@/lib/email'
import { buildIcsCalendar } from '@/lib/ics'
import { env } from '@/lib/env'
import { formatEventDate, formatEventTimeRange } from '@/lib/dates'
import { splitDisplayName } from '@/lib/names'
import type { ChurchEvent, Rsvp } from '@/lib/events'

/**
 * RSVP confirmation email: plain, branded-minimal HTML with the event
 * details, the signed manage link, and an .ics calendar attachment.
 * Shared by the free-RSVP route and the Stripe webhook (ticketed events).
 * Best-effort — the RSVP exists whether or not the email lands.
 */

export function rsvpManageUrl(rsvpId: string, manageToken: string): string {
  const base = env.siteUrl()
  return `${base}/events/rsvp/manage?id=${encodeURIComponent(rsvpId)}&token=${encodeURIComponent(manageToken)}`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendRsvpConfirmationEmail(args: {
  rsvp: Rsvp
  event: ChurchEvent
  manageUrl: string
}): Promise<boolean> {
  const { rsvp, event, manageUrl } = args
  const waitlist = rsvp.status === 'waitlist'
  // Greet by first name; legacy docs only carry the single-field `name`.
  const firstName = rsvp.firstName ?? splitDisplayName(rsvp.name).firstName ?? 'there'
  const when = `${formatEventDate(event.startAt, event.timezone)} · ${formatEventTimeRange(
    event.startAt,
    event.endAt,
    event.timezone
  )} CT`
  const where = event.location.address
    ? `${event.location.name}, ${event.location.address}`
    : event.location.name

  const html = `
    <div style="font-family: Georgia, serif; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
      <p style="text-transform: uppercase; letter-spacing: 0.18em; font-size: 11px; color: #8a6d3b; margin: 0 0 8px;">
        Amazing Grace Ministries MN
      </p>
      <h1 style="font-size: 28px; font-weight: 500; margin: 0 0 16px;">
        ${waitlist ? "You're on the waitlist" : "You're on the list"}
      </h1>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        Hi ${escapeHtml(firstName)}, ${
          waitlist
            ? `the event is currently at capacity, so we've added your party of ${rsvp.partySize} to the waitlist for <strong>${escapeHtml(event.title)}</strong>. We'll reach out if a spot opens up.`
            : `your RSVP for <strong>${escapeHtml(event.title)}</strong> is confirmed for a party of ${rsvp.partySize}. A calendar invite is attached.`
        }
      </p>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 4px;"><strong>When:</strong> ${escapeHtml(when)}</p>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;"><strong>Where:</strong> ${escapeHtml(where)}</p>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Need to change your plans? You can review or cancel your RSVP here:<br />
        <a href="${manageUrl}" style="color: #8a6d3b;">${manageUrl}</a>
      </p>
      <p style="font-size: 13px; color: #666; margin: 0;">
        Amazing Grace Ministries · 715 Edgerton Street, Saint Paul, MN 55130
      </p>
    </div>
  `.trim()

  const ics = buildIcsCalendar({
    uid: `rsvp-${rsvp.id}@amazinggracemn.org`,
    title: `${event.title} — Amazing Grace Ministries`,
    description: event.description,
    location: where,
    startAt: event.startAt,
    endAt: event.endAt,
    timeZone: event.timezone,
  })

  return sendEmail({
    to: rsvp.email,
    subject: waitlist
      ? `Waitlist: ${event.title}`
      : `RSVP confirmed: ${event.title}`,
    html,
    attachments: [
      {
        filename: 'event.ics',
        content: Buffer.from(ics, 'utf8').toString('base64'),
      },
    ],
  })
}
