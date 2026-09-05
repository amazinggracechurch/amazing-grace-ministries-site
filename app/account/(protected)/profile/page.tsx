import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Avatar from '@/components/ui/Avatar'
import ProfileForm from '@/components/account/ProfileForm'
import { getSessionUser } from '@/lib/auth/session'
import { getMemberProfile } from '@/lib/account/member'
import { splitDisplayName } from '@/lib/names'

export const metadata: Metadata = {
  title: 'Profile | Amazing Grace Ministries MN',
  description: 'Your name, photo, and communication preferences.',
}

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  // The (protected) layout already enforced this; re-check so the page
  // never renders unauthenticated even if reused elsewhere.
  const user = await getSessionUser()
  if (!user) redirect('/account/signin?next=/account/profile')

  const profile = await getMemberProfile(user.uid).catch(() => null)
  const photoURL = profile?.photoURL ?? user.photoURL
  const displayName = profile?.displayName ?? user.name ?? ''
  // Prefer the stored split; older profiles only have the single displayName.
  const legacy = splitDisplayName(displayName)
  const firstName = profile?.firstName ?? legacy.firstName ?? ''
  const lastName = profile?.lastName ?? legacy.lastName ?? ''

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <section className="flex-1 pt-32 pb-24 md:pt-40">
        <div className="mx-auto max-w-7xl px-6">
          <p className="eyebrow text-text-muted">Member Portal</p>
          <h1 className="mt-4 font-display text-display-md font-light uppercase tracking-display text-text-primary">
            Profile
            <span className="text-accent">.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-body text-text-secondary">
            How the church knows you — and how we keep in touch.
          </p>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            <aside className="border border-border-subtle bg-surface-raised p-6 sm:p-8">
              <div className="flex items-center gap-5">
                <Avatar src={photoURL ?? undefined} name={displayName || 'Member'} size="lg" />
                <div>
                  <p className="font-display text-heading font-medium tracking-display text-text-primary">
                    {displayName || 'Member'}
                  </p>
                  <p className="mt-1 text-body-sm text-text-secondary">{user.email}</p>
                </div>
              </div>
              <p className="mt-6 text-caption text-text-muted">
                Photo comes from your Google account — update it there to change it here.
                Your email address is your sign-in and cannot be changed.
              </p>
            </aside>

            <div className="border border-border-subtle bg-surface-raised p-6 sm:p-8 lg:col-span-2">
              <ProfileForm
                initial={{
                  firstName,
                  lastName,
                  phone: profile?.phone ?? '',
                  birthdate: profile?.birthdate ?? '',
                  interests: profile?.interests ?? [],
                  emailUpdates: profile?.communicationPrefs.emailUpdates ?? true,
                  pledgeReminders: profile?.communicationPrefs.pledgeReminders ?? true,
                }}
              />
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
