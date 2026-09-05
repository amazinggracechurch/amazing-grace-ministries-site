'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'

export type RefundButtonProps = {
  paymentIntentId: string
  /** Human-readable amount, e.g. "$120.00" — shown in the confirm copy. */
  amountLabel: string
}

/**
 * Refund affordance for a succeeded gift. The confirm dialog restates the
 * amount; the actual Stripe refund + audit entry happen server-side, and
 * the ledger row for the refund is written by the webhook's charge.refunded
 * handler (so a router.refresh() eventually reveals it).
 */
export default function RefundButton({ paymentIntentId, amountLabel }: RefundButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmRefund() {
    setPending(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/donations/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        setError(
          body?.error === 'already_refunded'
            ? 'This gift has already been refunded.'
            : 'The refund failed. Check Stripe and try again.'
        )
        return
      }
      setOpen(false)
      router.refresh()
    } catch {
      setError('The refund failed. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Refund
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Refund this gift?">
        <p className="text-body-sm text-text-secondary">
          This refunds <strong className="text-text-primary">{amountLabel}</strong> to the
          donor&apos;s original payment method. The gift stays in the ledger alongside a new
          refund entry (written automatically when Stripe confirms). This cannot be undone.
        </p>
        {error && (
          <p role="alert" className="mt-4 text-body-sm text-danger">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" size="md" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={confirmRefund} disabled={pending}>
            {pending ? 'Refunding…' : `Refund ${amountLabel}`}
          </Button>
        </div>
      </Dialog>
    </>
  )
}
