import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Button from '@/components/ui/Button'
import { getSessionUser } from '@/lib/auth/session'

/**
 * Guard for /admin — THE security boundary (proxy.ts is only a fast UX
 * redirect). Requires a verified session whose custom claim `role` is
 * 'admin' or 'superadmin'. Signed-in non-admins get a designed
 * not-authorized page instead of a redirect (no loop back into /account).
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser()
  if (!user) {
    redirect('/account/signin?next=/admin')
  }

  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return (
      <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
        <Navbar />
        <section className="flex flex-1 items-center pt-32 pb-24">
          <div className="mx-auto max-w-7xl px-6">
            <p className="eyebrow text-text-muted">Admin</p>
            <h1 className="mt-4 font-display text-display-md font-light uppercase tracking-display text-text-primary">
              This area is for church staff<span className="text-accent">.</span>
            </h1>
            <p className="mt-6 max-w-md text-body text-text-secondary">
              You&apos;re signed in as {user.email ?? 'a member'}, but this
              account doesn&apos;t have admin access. If you serve on staff,
              ask a superadmin to grant your account the admin role.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/account" variant="primary" size="lg">
                Go to My Account
              </Button>
              <Button href="/" variant="secondary" size="lg">
                Back to the Site
              </Button>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  return children
}
