import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import AccountNav from '@/components/account/AccountNav'
import { getSessionUser } from '@/lib/auth/session'

/**
 * Guard for the member portal — THE security boundary for /account
 * (proxy.ts is only a fast UX redirect and never trusts the cookie).
 *
 * Route-group layout: app/account is split into (auth) — the public
 * sign-in pages, which must stay reachable — and (protected), guarded
 * here. There is deliberately no app/account/layout.tsx, so this guard
 * can never accidentally wrap the sign-in flow into a redirect loop.
 */
export default async function ProtectedAccountLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await getSessionUser()
  if (!user) {
    redirect('/account/signin?next=/account')
  }
  return (
    <>
      <AccountNav />
      {children}
    </>
  )
}
