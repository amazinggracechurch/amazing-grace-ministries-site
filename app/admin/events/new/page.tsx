import type { Metadata } from 'next'
import AdminHeader from '@/components/admin/AdminHeader'
import EventForm from '@/components/admin/EventForm'

export const metadata: Metadata = {
  title: 'New Event | Admin | Amazing Grace Ministries MN',
}

export const dynamic = 'force-dynamic'

export default function NewEventPage() {
  return (
    <div>
      <AdminHeader title="New Event" description="Create an event and open RSVPs." />
      <EventForm />
    </div>
  )
}
