import AnnouncementBar from '@/components/AnnouncementBar'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import EventsHero from '@/components/events/EventsHero'
import UpcomingEvents from '@/components/events/UpcomingEvents'
import RecurringRhythms from '@/components/events/RecurringRhythms'
import EventsCTA from '@/components/events/EventsCTA'
import { listPublishedEvents, splitEventsByTime, type ChurchEvent } from '@/lib/events'

export const metadata = {
  title: 'Events | Amazing Grace Ministries MN',
  description:
    'Discover upcoming events, gatherings, and experiences at Amazing Grace Ministries MN. There is always something meaningful happening.',
}

// Events live in Firestore — render per request, never prerender stale data.
export const dynamic = 'force-dynamic'

/** Firestore being unreachable must never take the page down. */
async function loadEvents(): Promise<ChurchEvent[]> {
  try {
    return await listPublishedEvents()
  } catch (error) {
    console.error('[events] failed to load events', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return []
  }
}

export default async function EventsPage() {
  const events = await loadEvents()
  const { upcoming, past } = splitEventsByTime(events)

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <AnnouncementBar />
      <EventsHero />
      <UpcomingEvents upcoming={upcoming} past={past} />
      <RecurringRhythms />
      <EventsCTA />
      <Footer />
    </main>
  )
}
