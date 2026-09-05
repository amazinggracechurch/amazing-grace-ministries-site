import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import FinishSignIn from '@/components/auth/FinishSignIn'

export const metadata: Metadata = {
  title: 'Finishing Sign-In | Amazing Grace Ministries MN',
  description: 'Completing your email sign-in to Amazing Grace Ministries.',
}

export default function FinishSignInPage() {
  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <section className="flex-1 pt-32 pb-24 md:pt-40">
        <div className="mx-auto max-w-7xl px-6">
          <FinishSignIn />
        </div>
      </section>
      <Footer />
    </main>
  )
}
