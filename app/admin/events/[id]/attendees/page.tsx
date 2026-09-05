import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import EmailAttendeesForm from '@/components/admin/EmailAttendeesForm'
import Badge, { type BadgeVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { getEventById, type RsvpStatus } from '@/lib/events'
import { listRsvpsForEvent } from '@/lib/admin/rsvps'
import { formatEventDate } from '@/lib/dates'
import { fullName } from '@/lib/names'

export const metadata: Metadata = {
  title: 'Attendees | Admin | Amazing Grace Ministries MN',
}

export const dynamic = 'force-dynamic'

const STATUS_VARIANTS: Record<RsvpStatus, BadgeVariant> = {
  confirmed: 'success',
  waitlist: 'warning',
  cancelled: 'neutral',
}

export default async function EventAttendeesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getEventById(id)
  if (!event) notFound()

  const rsvps = await listRsvpsForEvent(id)
  const confirmedCount = rsvps.filter((rsvp) => rsvp.status === 'confirmed').length

  return (
    <div>
      <AdminHeader
        title="Attendees"
        description={`${event.title} — ${formatEventDate(event.startAt, event.timezone)}. ${confirmedCount} confirmed, ${rsvps.length} total RSVPs.`}
        action={
          <Button href={`/api/admin/events/${event.id}/attendees`} variant="secondary">
            Download CSV
          </Button>
        }
      />

      {rsvps.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="No RSVPs yet" body="Attendees appear here as they RSVP." />
        </div>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border-strong text-caption uppercase tracking-eyebrow text-text-muted">
                <th scope="col" className="py-3 pr-4 font-semibold">Name</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Email</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Party</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Status</th>
                <th scope="col" className="py-3 font-semibold">RSVPed</th>
              </tr>
            </thead>
            <tbody>
              {rsvps.map((rsvp) => (
                <tr key={rsvp.id} className="border-b border-border-subtle align-middle">
                  <td className="py-3 pr-4 text-body-sm font-semibold text-text-primary">
                    {fullName(rsvp.firstName, rsvp.lastName) || rsvp.name}
                  </td>
                  <td className="py-3 pr-4 text-body-sm text-text-secondary">{rsvp.email}</td>
                  <td className="py-3 pr-4 text-body-sm text-text-secondary">{rsvp.partySize}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={STATUS_VARIANTS[rsvp.status]}>{rsvp.status}</Badge>
                  </td>
                  <td className="py-3 text-body-sm text-text-secondary">
                    {new Date(rsvp.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-14 max-w-2xl border-t border-border-subtle pt-10">
        <h2 className="font-display text-heading tracking-display text-text-primary">
          Email attendees
        </h2>
        <p className="mt-2 text-body-sm text-text-secondary">
          Sends one email per confirmed attendee (batched). Waitlisted and cancelled RSVPs are
          skipped.
        </p>
        <div className="mt-6">
          <EmailAttendeesForm eventId={event.id} confirmedCount={confirmedCount} />
        </div>
      </div>
    </div>
  )
}
