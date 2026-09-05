'use client'

import { useState } from 'react'
import { CalendarX } from 'lucide-react'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

/**
 * "Cancel RSVP" button on the manage page. Confirms in place, posts to
 * /api/rsvps/cancel, and swaps to a cancelled confirmation state.
 */
export default function CancelRsvpButton({ id, token }: { id: string; token: string }) {
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)

  async function handleCancel() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/rsvps/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, token }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        setError(data?.error ?? 'Something went wrong. Please try again.')
        return
      }
      setCancelled(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (cancelled) {
    return (
      <div className="border border-border-subtle bg-surface-raised p-8">
        <div className="flex size-12 items-center justify-center bg-accent-subtle text-accent">
          <CalendarX className="size-6" aria-hidden />
        </div>
        <h2 className="mt-4 font-display text-heading text-text-primary">RSVP cancelled</h2>
        <p className="mt-3 text-body-sm text-text-secondary">
          Your RSVP has been cancelled. If someone was on the waitlist, their spot
          has been confirmed. We hope to see you at a future gathering.
        </p>
        <div className="mt-6">
          <Button href="/events" variant="secondary">
            Upcoming Events
          </Button>
        </div>
      </div>
    )
  }

  if (!confirming) {
    return (
      <div className="border border-border-subtle bg-surface-raised p-8">
        <h2 className="font-display text-heading text-text-primary">Need to change your plans?</h2>
        <p className="mt-3 text-body-sm text-text-secondary">
          You can cancel your RSVP below. If the event has a waitlist, your spot
          will be offered to the next person in line.
        </p>
        <div className="mt-6">
          <Button variant="secondary" onClick={() => setConfirming(true)}>
            Cancel RSVP
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-border-subtle bg-surface-raised p-8">
      <h2 className="font-display text-heading text-text-primary">Cancel this RSVP?</h2>
      <p className="mt-3 text-body-sm text-text-secondary">
        This releases your spot and can&rsquo;t be undone from this page — you can
        always RSVP again from the event page.
      </p>
      {error && (
        <p role="alert" className="mt-4 text-body-sm text-danger">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button onClick={handleCancel} disabled={submitting}>
          {submitting && <Spinner size="sm" />}
          {submitting ? 'Cancelling…' : 'Yes, cancel my RSVP'}
        </Button>
        <Button variant="ghost" onClick={() => setConfirming(false)} disabled={submitting}>
          Keep my RSVP
        </Button>
      </div>
    </div>
  )
}
