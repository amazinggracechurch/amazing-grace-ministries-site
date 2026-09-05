'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { AuthProvider, useAuth } from './AuthProvider'

/** Self-providing sign-out button for the account dashboard. */

function SignOutButtonInner() {
  const { signOut } = useAuth()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const handleSignOut = async () => {
    setBusy(true)
    setFailed(false)
    try {
      await signOut()
      router.replace('/')
      router.refresh()
    } catch {
      setBusy(false)
      setFailed(true)
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-2">
      <Button variant="secondary" onClick={handleSignOut} disabled={busy}>
        {busy && <Spinner size="sm" />}
        {busy ? 'Signing out…' : 'Sign Out'}
      </Button>
      {failed && (
        <span role="alert" className="text-caption text-danger">
          Sign-out failed. Please try again.
        </span>
      )}
    </span>
  )
}

export default function SignOutButton() {
  return (
    <AuthProvider>
      <SignOutButtonInner />
    </AuthProvider>
  )
}
