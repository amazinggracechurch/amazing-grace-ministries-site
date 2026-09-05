import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import EmptyState from '@/components/ui/EmptyState'
import { LayoutDashboard } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Admin | Amazing Grace Ministries MN',
  description: 'Church staff administration.',
}

export const dynamic = 'force-dynamic'

/**
 * Placeholder landing for /admin — proves the role guard works; the real
 * dashboard arrives in Phase 2 (spec §7.6).
 */
export default function AdminPage() {
  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <section className="flex-1 pt-32 pb-24 md:pt-40">
        <div className="mx-auto max-w-7xl px-6">
          <p className="eyebrow text-text-muted">Admin</p>
          <h1 className="mt-4 font-display text-display-md font-light uppercase tracking-display text-text-primary">
            Staff Dashboard<span className="text-accent">.</span>
          </h1>
          <div className="mt-12">
            <EmptyState
              icon={<LayoutDashboard className="size-6" aria-hidden />}
              title="The dashboard is on its way"
              body="Giving trends, projects, events, blog, members, and site settings land here in Phase 2."
            />
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
