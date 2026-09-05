import { adminGuard } from '@/lib/admin/guard'
import { getEventById } from '@/lib/events'
import { listRsvpsForEvent } from '@/lib/admin/rsvps'
import { fullName } from '@/lib/names'

/**
 * CSV export of an event's attendee list. GET, admin-only.
 * Streams a text/csv attachment — no mutation, so no audit entry.
 */

/** RFC 4180 escaping: quote when the value can break a cell. */
function csvCell(value: string | number | null): string {
  const text = value === null ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await adminGuard()
  if (!guard.ok) return guard.response

  const { id } = await params
  const event = await getEventById(id)
  if (!event) {
    return Response.json({ error: 'Event not found.' }, { status: 404 })
  }

  const rsvps = await listRsvpsForEvent(id)
  const header = 'Name,Email,Phone,Party Size,Status,Notes,RSVPed At'
  const rows = rsvps.map((rsvp) =>
    [
      csvCell(fullName(rsvp.firstName, rsvp.lastName) || rsvp.name),
      csvCell(rsvp.email),
      csvCell(rsvp.phone),
      csvCell(rsvp.partySize),
      csvCell(rsvp.status),
      csvCell(rsvp.notes),
      csvCell(rsvp.createdAt),
    ].join(',')
  )
  const csv = [header, ...rows].join('\r\n') + '\r\n'

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="attendees-${event.slug}.csv"`,
    },
  })
}
