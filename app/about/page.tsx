import AnnouncementBar from '@/components/AnnouncementBar'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import AboutHero from '@/components/about/AboutHero'
import OurStory from '@/components/about/OurStory'
import MeetThePastor from '@/components/about/MeetThePastor'
import OurBeliefs from '@/components/about/OurBeliefs'
import OurValues from '@/components/about/OurValues'
import VisitCTA from '@/components/about/VisitCTA'

export const metadata = {
  title: 'About Us | Amazing Grace Ministries MN',
  description: 'We are the Amazing Family — a non-denominational, Spirit-filled community led by Pastor Nnaemeka Uchegbu, dedicated to spreading hope, love, and the teachings of Christ.',
}

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <AnnouncementBar />
      <AboutHero />
      <OurStory />
      <MeetThePastor />
      <OurBeliefs />
      <OurValues />
      <VisitCTA />
      <Footer />
    </main>
  )
}
