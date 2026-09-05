'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import type { OrderStatus } from '@/lib/shop'

export type OrderStatusActionsProps = {
  orderId: string
  orderNumber: string
  status: OrderStatus
}

type Transition = { to: OrderStatus; label: string; confirm: string }

const TRANSITIONS: Partial<Record<OrderStatus, Transition[]>> = {
  paid: [
    { to: 'ready', label: 'Mark ready', confirm: 'Mark this order as ready for pickup?' },
    { to: 'collected', label: 'Mark collected', confirm: 'Mark this order as collected and hand over the items?' },
  ],
  ready: [
    { to: 'collected', label: 'Mark collected', confirm: 'Mark this order as collected and hand over the items?' },
  ],
}

/**
 * Status transition buttons for admin order rows. Each transition sits
 * behind a confirm dialog; the API validates the transition again and
 * audits it.
 */
export default function OrderStatusActions({ orderId, orderNumber, status }: OrderStatusActionsProps) {
  const router = useRouter()
  const [pending, setPending] = useState<Transition | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const transitions = TRANSITIONS[status] ?? []
  if (transitions.length === 0 && !error) return null

  async function confirmTransition() {
    if (!pending) return
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/shop/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: pending.to }),
      })
      const data = (await response.json()) as { error?: string }
      if (!response.ok) {
        setError(data.error ?? 'Could not update the order.')
        return
      }
      setPending(null)
      router.refresh()
    } catch {
      setError('Could not update the order. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {transitions.map((transition) => (
        <Button
          key={transition.to}
          variant={transition.to === 'collected' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setPending(transition)}
        >
          {transition.label}
        </Button>
      ))}
      {error && (
        <span role="alert" className="text-caption text-danger">
          {error}
        </span>
      )}
      <Dialog
        open={pending !== null}
        onClose={() => (saving ? null : setPending(null))}
        title={pending?.label ?? 'Confirm'}
      >
        <p className="text-body text-text-secondary">
          {pending?.confirm} <span className="font-semibold text-text-primary">({orderNumber})</span>
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="primary" disabled={saving} onClick={confirmTransition}>
            {saving ? 'Saving…' : 'Confirm'}
          </Button>
          <Button variant="ghost" disabled={saving} onClick={() => setPending(null)}>
            Cancel
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
