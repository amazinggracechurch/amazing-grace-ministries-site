'use client'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

/**
 * Opens Stripe's hosted Billing Portal for this member: POSTs to
 * /api/account/billing-portal, which finds-or-creates the Stripe Customer
 * and returns a portal session URL. Card changes, pausing, and cancellation
 * all happen inside Stripe's hosted UI — card data never touches this site.
 */
export default function ManageBillingButton() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openPortal = async () => {
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/account/billing-portal', { method: 'POST' })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'Something went wrong. Please try again.')
      }
      window.location.assign(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <span className="inline-flex flex-col gap-2">
      <Button disabled={submitting} onClick={() => void openPortal()}>
        {submitting ? (
          <>
            <Spinner size="sm" /> Opening…
          </>
        ) : (
          'Manage billing'
        )}
      </Button>
      {error && (
        <span role="alert" className="text-caption text-danger">
          {error}
        </span>
      )}
    </span>
  )
}
