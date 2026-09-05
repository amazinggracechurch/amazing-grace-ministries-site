import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import EventForm from '@/components/admin/EventForm'
import { getEventById } from '@/lib/events'

export const metadata: Metadata = {
  title: 'Edit Event | Admin | Amazing Grace Ministries MN',
}

export const dynamic = 'force-dynamic'

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getEventById(id)
  if (!event) notFound()

  return (
    <div>
      <AdminHeader
        title="Edit Event"
        description={`Editing “${event.title}”. The RSVP count is managed by the RSVP flow and can't be edited here.`}
      />
      <EventForm initial={event} />
    </div>
  )
}
