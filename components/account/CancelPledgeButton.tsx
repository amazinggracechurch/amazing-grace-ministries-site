'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

/**
 * Cancels one of the member's pledges via /api/pledges/cancel, then
 * refreshes the server-rendered list. The server enforces ownership.
 */
export default function CancelPledgeButton({ pledgeId }: { pledgeId: string }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCancel = async () => {
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/pledges/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pledgeId }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        throw new Error(data.error ?? 'Something went wrong. Please try again.')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <span className="inline-flex flex-col gap-2">
      <Button variant="ghost" size="sm" disabled={submitting} onClick={() => void handleCancel()}>
        {submitting ? (
          <>
            <Spinner size="sm" /> Cancelling…
          </>
        ) : (
          'Cancel pledge'
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
