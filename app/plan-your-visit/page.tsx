import Navbar from '@/components/Navbar'
import AnnouncementBar from '@/components/AnnouncementBar'
import VisitHero from '@/components/visit/VisitHero'
import WhatToExpect from '@/components/visit/WhatToExpect'
import ServiceTimesBand from '@/components/home/ServiceTimesBand'
import LocationMap from '@/components/visit/LocationMap'
import VisitFAQ from '@/components/visit/VisitFAQ'
import VisitContactCTA from '@/components/visit/VisitContactCTA'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Plan Your Visit | Amazing Grace Ministries MN',
  description: 'Everything you need to know before your first visit — service times, location, what to expect, and how to join us online.',
}

export default function PlanYourVisitPage() {
  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <AnnouncementBar />
      <VisitHero />
      <WhatToExpect />
      <ServiceTimesBand />
      <LocationMap />
      <VisitFAQ />
      <VisitContactCTA />
      <Footer />
    </main>
  )
}
