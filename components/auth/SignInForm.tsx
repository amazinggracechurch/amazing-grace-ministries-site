'use client'
import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import { AuthProvider, useAuth } from './AuthProvider'

/**
 * Sign-in form for /account/signin — Google popup or email magic link.
 * Self-provides its AuthProvider. `next` is the post-sign-in destination
 * (already sanitized by the page).
 */

type SignInFormProps = {
  next: string
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 12 0 11.99 11.99 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  )
}

function errorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return ''
    case 'auth/invalid-email':
      return 'That email address doesn\u2019t look right.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    default:
      return 'Something went wrong on our end. Please try again.'
  }
}

function SignInFormInner({ next }: SignInFormProps) {
  const { user, loading, signInWithGoogle, sendMagicLink, refreshSession } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState<'google' | 'email' | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Already signed in (e.g. Firebase session outlived the cookie) —
  // re-mint the session cookie if needed, then move along.
  useEffect(() => {
    if (loading || !user) return
    let cancelled = false
    refreshSession()
      .catch(() => {
        // Cookie could not be re-established; stay on the form.
      })
      .finally(() => {
        if (!cancelled) router.replace(next)
      })
    return () => {
      cancelled = true
    }
  }, [user, loading, next, refreshSession, router])

  const handleGoogle = async () => {
    setBusy('google')
    setError('')
    try {
      await signInWithGoogle()
      router.replace(next)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(null)
    }
  }

  const handleMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy('email')
    setError('')
    try {
      await sendMagicLink(email.trim())
      setSentTo(email.trim())
      setBusy(null)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(null)
    }
  }

  if (loading || user) {
    return (
      <div className="flex items-center justify-center py-16" aria-label="Checking your sign-in">
        <Spinner size="lg" />
      </div>
    )
  }

  if (sentTo) {
    return (
      <div className="flex flex-col items-start gap-4" role="status">
        <h2 className="font-display text-heading tracking-display text-text-primary">
          Check your inbox.
        </h2>
        <p className="text-body text-text-secondary">
          We sent a sign-in link to{' '}
          <span className="font-semibold text-text-primary">{sentTo}</span>. Click it
          to finish signing in — no password needed. You can close this tab.
        </p>
        <Button
          variant="link"
          onClick={() => {
            setSentTo(null)
            setEmail('')
          }}
        >
          Use a different email
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={handleGoogle}
        disabled={busy !== null}
      >
        {busy === 'google' ? <Spinner size="sm" /> : <GoogleMark />}
        {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
      </Button>

      <div className="flex items-center gap-4" aria-hidden>
        <span className="h-px flex-1 bg-border-subtle" />
        <span className="eyebrow text-text-muted">or with email</span>
        <span className="h-px flex-1 bg-border-subtle" />
      </div>

      <form onSubmit={handleMagicLink} className="flex flex-col gap-4" noValidate>
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.org"
          hint="We’ll email you a one-time sign-in link."
          error={error || undefined}
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={busy !== null || email.trim().length === 0}
        >
          {busy === 'email' && <Spinner size="sm" />}
          {busy === 'email' ? 'Sending…' : 'Email Me a Sign-In Link'}
        </Button>
      </form>
    </div>
  )
}

export default function SignInForm({ next }: SignInFormProps) {
  return (
    <AuthProvider>
      <SignInFormInner next={next} />
    </AuthProvider>
  )
}
