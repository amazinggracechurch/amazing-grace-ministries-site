import AnnouncementBar from '@/components/AnnouncementBar'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import SermonsHero from '@/components/sermons/SermonsHero'
import FeaturedSermon from '@/components/sermons/FeaturedSermon'
import SermonSeries from '@/components/sermons/SermonSeries'
import SermonBrowser from '@/components/sermons/SermonBrowser'
import YouTubeCTA from '@/components/sermons/YouTubeCTA'

export const metadata = {
  title: 'Sermons | Amazing Grace Ministries MN',
  description: 'Watch and listen to messages from Amazing Grace Ministries MN. Spirit-filled teaching available anytime, anywhere.',
}

export default function SermonsPage() {
  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <AnnouncementBar />
      <SermonsHero />
      <FeaturedSermon />
      <SermonSeries />
      <SermonBrowser />
      <YouTubeCTA />
      <Footer />
    </main>
  )
}
