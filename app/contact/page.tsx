import AnnouncementBar from '@/components/AnnouncementBar'
import Navbar from '@/components/Navbar'
import ContactHero from '@/components/contact/ContactHero'
import ContactMain from '@/components/contact/ContactMain'
import MapSection from '@/components/contact/MapSection'
import ConnectStrip from '@/components/contact/ConnectStrip'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Contact Us | Amazing Grace Ministries MN',
  description: 'Get in touch with Amazing Grace Ministries MN. We would love to hear from you.',
}

export default function ContactPage() {
  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <AnnouncementBar />
      <ContactHero />
      <ContactMain />
      <MapSection />
      <ConnectStrip />
      <Footer />
    </main>
  )
}
