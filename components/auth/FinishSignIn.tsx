'use client'
import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import { clientAuth } from '@/lib/firebase/client'
import { EMAIL_FOR_SIGNIN_KEY, establishSession } from './AuthProvider'

/**
 * Completes the magic-link flow at /account/signin/finish (spec §7.2).
 * The email is recovered from localStorage; if the link was opened on a
 * different device, we ask for it. No AuthProvider needed here — this is
 * a one-shot exchange, not a subscribed view.
 */

type State =
  | { kind: 'working' }
  | { kind: 'needs-email' }
  | { kind: 'error'; message: string }

const EXPIRED_MESSAGE =
  'This sign-in link has expired or was already used. Request a fresh one.'

export default function FinishSignIn() {
  const router = useRouter()
  const [state, setState] = useState<State>({ kind: 'working' })
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const complete = async (address: string) => {
    setState({ kind: 'working' })
    try {
      const credential = await signInWithEmailLink(
        clientAuth(),
        address,
        window.location.href
      )
      await establishSession(credential.user)
      try {
        window.localStorage.removeItem(EMAIL_FOR_SIGNIN_KEY)
      } catch {
        // Non-fatal.
      }
      router.replace('/account')
    } catch (err) {
      const code = (err as { code?: string } | null)?.code
      setState({
        kind: 'error',
        message:
          code === 'auth/invalid-action-code' || code === 'auth/expired-action-code'
            ? EXPIRED_MESSAGE
            : 'Something went wrong on our end. Please try again.',
      })
    }
  }

  useEffect(() => {
    const run = async () => {
      if (!isSignInWithEmailLink(clientAuth(), window.location.href)) {
        setState({ kind: 'error', message: EXPIRED_MESSAGE })
        return
      }
      let stored: string | null = null
      try {
        stored = window.localStorage.getItem(EMAIL_FOR_SIGNIN_KEY)
      } catch {
        // Private browsing — fall through to the prompt.
      }
      if (stored) {
        await complete(stored)
      } else {
        setState({ kind: 'needs-email' })
      }
    }
    void run()
    // Run once on mount; `complete` is stable enough for this one-shot flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    void complete(email.trim()).finally(() => setSubmitting(false))
  }

  return (
    <div className="flex flex-col items-start gap-6">
      {state.kind === 'working' && (
        <>
          <h1 className="font-display text-display-md font-light uppercase tracking-display text-text-primary">
            One moment<span className="text-accent">.</span>
          </h1>
          <div className="flex items-center gap-3 text-body text-text-secondary">
            <Spinner />
            <p>Finishing your sign-in…</p>
          </div>
        </>
      )}

      {state.kind === 'needs-email' && (
        <>
          <h1 className="font-display text-display-md font-light uppercase tracking-display text-text-primary">
            Confirm your email<span className="text-accent">.</span>
          </h1>
          <p className="max-w-md text-body text-text-secondary">
            You opened this link on a different device or browser. Enter the
            email address the link was sent to and we&apos;ll finish signing
            you in.
          </p>
          <form onSubmit={handleEmailSubmit} className="flex w-full max-w-md flex-col gap-4">
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.org"
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting || email.trim().length === 0}
            >
              {submitting && <Spinner size="sm" />}
              {submitting ? 'Signing in…' : 'Finish Signing In'}
            </Button>
          </form>
        </>
      )}

      {state.kind === 'error' && (
        <>
          <h1 className="font-display text-display-md font-light uppercase tracking-display text-text-primary">
            That link didn&apos;t work<span className="text-accent">.</span>
          </h1>
          <p role="alert" className="max-w-md text-body text-text-secondary">
            {state.message}
          </p>
          <Button href="/account/signin" variant="primary" size="lg">
            Back to Sign In
          </Button>
        </>
      )}
    </div>
  )
}
