import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { HandHeart, CalendarCheck, UserRound } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import SignOutButton from '@/components/auth/SignOutButton'
import { getSessionUser } from '@/lib/auth/session'
import { adminDb } from '@/lib/firebase/admin'

export const metadata: Metadata = {
  title: 'My Account | Amazing Grace Ministries MN',
  description: 'Your Amazing Grace Ministries member account.',
}

export const dynamic = 'force-dynamic'

const COMING_SOON = [
  {
    icon: HandHeart,
    title: 'Giving History',
    body: 'Every gift, receipt, and your annual statement.',
  },
  {
    icon: CalendarCheck,
    title: 'My RSVPs',
    body: 'Events you\u2019ve reserved a seat for.',
  },
  {
    icon: UserRound,
    title: 'Profile',
    body: 'Name, photo, and communication preferences.',
  },
] as const

async function memberSince(uid: string): Promise<string | null> {
  try {
    const snapshot = await adminDb().collection('users').doc(uid).get()
    const createdAt = snapshot.get('createdAt')
    const date =
      createdAt && typeof createdAt.toDate === 'function'
        ? (createdAt.toDate() as Date)
        : null
    if (!date) return null
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return null
  }
}

export default async function AccountPage() {
  // The (protected) layout already enforced this; re-check so the page
  // never renders unauthenticated even if reused elsewhere.
  const user = await getSessionUser()
  if (!user) redirect('/account/signin?next=/account')

  const name = user.name ?? 'Friend'
  const firstName = name.trim().split(/\s+/)[0] ?? 'Friend'
  const since = await memberSince(user.uid)

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <section className="flex-1 pt-32 pb-24 md:pt-40">
        <div className="mx-auto max-w-7xl px-6">
          <p className="eyebrow text-text-muted">Member Portal</p>
          <div className="mt-6 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <Avatar
                src={user.photoURL ?? undefined}
                name={name}
                size="lg"
              />
              <div>
                <h1 className="font-display text-display-md font-light uppercase tracking-display text-text-primary">
                  Welcome, {firstName}
                  <span className="text-accent">.</span>
                </h1>
                <p className="mt-2 text-body-sm text-text-secondary">
                  {user.email}
                  {since && (
                    <span className="text-text-muted">
                      {' '}
                      · Member since {since}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <SignOutButton />
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {COMING_SOON.map((item) => (
              <Card key={item.title} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center bg-accent-subtle text-accent">
                    <item.icon className="size-5" aria-hidden />
                  </span>
                  <Badge>Coming soon</Badge>
                </div>
                <h2 className="font-display text-heading tracking-display text-text-primary">
                  {item.title}
                </h2>
                <p className="text-body-sm text-text-secondary">{item.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
