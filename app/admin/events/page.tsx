import type { Metadata } from 'next'
import AdminHeader from '@/components/admin/AdminHeader'
import Badge, { type BadgeVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { listAllEvents } from '@/lib/admin/events'
import { formatEventDate, formatEventTimeRange } from '@/lib/dates'
import type { EventStatus } from '@/lib/events'

export const metadata: Metadata = {
  title: 'Events | Admin | Amazing Grace Ministries MN',
}

export const dynamic = 'force-dynamic'

const STATUS_VARIANTS: Record<EventStatus, BadgeVariant> = {
  draft: 'neutral',
  published: 'success',
  cancelled: 'danger',
}

export default async function AdminEventsPage() {
  const events = await listAllEvents()

  return (
    <div>
      <AdminHeader
        title="Events"
        description="Gatherings open for RSVP. Times are shown in church time (America/Chicago)."
        action={
          <Button href="/admin/events/new" variant="primary">
            New event
          </Button>
        }
      />
      {events.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No events yet"
            body="Create your first event to open RSVPs."
            action={
              <Button href="/admin/events/new" variant="primary">
                New event
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border-strong text-caption uppercase tracking-eyebrow text-text-muted">
                <th scope="col" className="py-3 pr-4 font-semibold">Event</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Date</th>
                <th scope="col" className="py-3 pr-4 font-semibold">RSVPs</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Status</th>
                <th scope="col" className="py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-border-subtle align-middle">
                  <td className="py-4 pr-4">
                    <span className="text-body font-semibold text-text-primary">{event.title}</span>
                    <span className="block text-caption text-text-muted">/{event.slug}</span>
                  </td>
                  <td className="py-4 pr-4 text-body-sm text-text-secondary">
                    {formatEventDate(event.startAt, event.timezone)}
                    <span className="block text-caption text-text-muted">
                      {formatEventTimeRange(event.startAt, event.endAt, event.timezone)}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-body-sm text-text-secondary">
                    {event.rsvpCount}
                    {event.capacity !== null ? ` / ${event.capacity}` : ' seats'}
                  </td>
                  <td className="py-4 pr-4">
                    <Badge variant={STATUS_VARIANTS[event.status]}>{event.status}</Badge>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button href={`/admin/events/${event.id}/edit`} variant="secondary" size="sm">
                        Edit
                      </Button>
                      <Button href={`/admin/events/${event.id}/attendees`} variant="ghost" size="sm">
                        Attendees
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
