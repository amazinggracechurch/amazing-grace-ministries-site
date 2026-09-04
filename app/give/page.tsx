import AnnouncementBar from '@/components/AnnouncementBar'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import GiveFAQ from '@/components/give/GiveFAQ'
import GiveHero from '@/components/give/GiveHero'
import GivingForm from '@/components/give/GivingForm'
import GivingOptions from '@/components/give/GivingOptions'
import ImpactSection from '@/components/give/ImpactSection'
import ScriptureSection from '@/components/give/ScriptureSection'

export const metadata = {
  title: 'Give | Amazing Grace Ministries MN',
  description: 'Partner with Amazing Grace Ministries MN through generous giving. Every gift makes an impact.',
}

export default function GivePage() {
  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <AnnouncementBar />
      <GiveHero />
      <GivingOptions />
      <GivingForm />
      <ImpactSection />
      <ScriptureSection />
      <GiveFAQ />
      <Footer />
    </main>
  )
}
