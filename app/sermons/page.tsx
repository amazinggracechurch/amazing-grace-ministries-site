import AnnouncementBar from '@/components/AnnouncementBar'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import SermonsHero from '@/components/sermons/SermonsHero'
import FeaturedSermon from '@/components/sermons/FeaturedSermon'
import LatestServices from '@/components/sermons/LatestServices'
import SermonSeries from '@/components/sermons/SermonSeries'
import SermonBrowser from '@/components/sermons/SermonBrowser'
import YouTubeCTA from '@/components/sermons/YouTubeCTA'
import { getRecentSermons } from '@/lib/youtube'
import { getSiteSettings } from '@/lib/site-settings'

export const metadata = {
  title: 'Sermons | Amazing Grace Ministries MN',
  description: 'Watch and listen to messages from Amazing Grace Ministries MN. Spirit-filled teaching available anytime, anywhere.',
}

export default async function SermonsPage() {
  const settings = await getSiteSettings()
  const sermons = await getRecentSermons(4)
  const latest = sermons[0]

  const jsonLd = latest
    ? {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: latest.title,
        description: latest.title,
        uploadDate: latest.publishedAt,
        thumbnailUrl: latest.thumbnail,
        embedUrl: `https://www.youtube-nocookie.com/embed/${latest.id}`,
      }
    : null

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
      )}
      <Navbar />
      <AnnouncementBar />
      <SermonsHero />
      <FeaturedSermon sermon={latest} />
      <LatestServices sermons={sermons} youtubeUrl={settings.socials.youtube} />
      <SermonSeries />
      <SermonBrowser youtubeUrl={settings.socials.youtube} />
      <YouTubeCTA />
      <Footer />
    </main>
  )
}
