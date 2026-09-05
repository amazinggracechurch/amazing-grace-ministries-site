'use client'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import { AuthProvider, useAuth } from './AuthProvider'

/**
 * Navbar auth affordance — self-provides its AuthProvider so the Navbar
 * can drop it in without any page-level wiring. Signed out: a quiet
 * "Sign In" link. Signed in: the member's avatar, linking to /account.
 */

function AuthMenuInner() {
  const { user, loading } = useAuth()

  if (loading) {
    // Reserve the avatar's footprint so the nav doesn't shift on resolve.
    return <span className="block size-8" aria-hidden />
  }

  if (!user) {
    return (
      <Link
        href="/account/signin"
        className="font-body font-semibold text-body-sm uppercase tracking-[0.08em] text-text-secondary transition-colors duration-200 hover:text-accent"
      >
        Sign In
      </Link>
    )
  }

  const name = user.name ?? user.email ?? 'Member'
  return (
    <Link
      href="/account"
      aria-label={`Your account, ${name}`}
      className="block transition-opacity duration-200 hover:opacity-80"
    >
      <Avatar src={user.photoURL ?? undefined} name={name} size="sm" />
    </Link>
  )
}

export default function AuthMenu() {
  return (
    <AuthProvider>
      <AuthMenuInner />
    </AuthProvider>
  )
}
