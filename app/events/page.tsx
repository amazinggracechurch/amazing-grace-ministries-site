import AnnouncementBar from '@/components/AnnouncementBar'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import EventsHero from '@/components/events/EventsHero'
import UpcomingEvents from '@/components/events/UpcomingEvents'
import RecurringRhythms from '@/components/events/RecurringRhythms'
import EventsCTA from '@/components/events/EventsCTA'

export const metadata = {
  title: 'Events | Amazing Grace Ministries MN',
  description: 'Discover upcoming events, gatherings, and experiences at Amazing Grace Ministries MN. There is always something meaningful happening.',
}

export default function EventsPage() {
  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <AnnouncementBar />
      <EventsHero />
      <UpcomingEvents />
      <RecurringRhythms />
      <EventsCTA />
      <Footer />
    </main>
  )
}
