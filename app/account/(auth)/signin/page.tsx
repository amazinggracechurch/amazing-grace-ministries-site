import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Card from '@/components/ui/Card'
import SignInForm from '@/components/auth/SignInForm'

export const metadata: Metadata = {
  title: 'Sign In | Amazing Grace Ministries MN',
  description:
    'Sign in to your Amazing Grace Ministries account with Google or a one-time email link — no password needed.',
}

type SignInPageProps = {
  searchParams: Promise<{ next?: string }>
}

/** Only same-site absolute paths may be redirect targets. */
function safeNext(raw: string | undefined): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw
  return '/account'
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { next } = await searchParams

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <section className="flex-1 pt-32 pb-24 md:pt-40">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2 lg:gap-24">
          <div>
            <p className="eyebrow text-text-muted">Member Portal</p>
            <h1 className="mt-4 font-display text-display-lg font-light uppercase tracking-display text-text-primary">
              Welcome
              <span className="block italic normal-case text-accent">Home.</span>
            </h1>
            <p className="mt-6 max-w-md text-body text-text-secondary">
              Sign in to see your giving history, event RSVPs, and profile.
              No passwords here — use Google, or we&apos;ll email you a
              one-time link.
            </p>
          </div>
          <div className="lg:pt-16">
            <Card className="mx-auto w-full max-w-md p-8" padded={false}>
              <SignInForm next={safeNext(next)} />
            </Card>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
