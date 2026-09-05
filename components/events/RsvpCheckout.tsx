'use client'

import { useState, type FormEvent } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'

/**
 * Ticketed-event RSVP. Collects name/email/party size, then posts to
 * /api/rsvps/checkout and redirects to Stripe Checkout. The RSVP itself is
 * only written by the webhook on checkout.session.completed.
 */

export default function RsvpCheckout({
  eventId,
  priceCents,
}: {
  eventId: string
  priceCents: number
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [partySize, setPartySize] = useState('1')
  const [website, setWebsite] = useState('') // honeypot
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ firstName?: string; lastName?: string }>({})

  const price = (priceCents / 100).toFixed(2)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nextFieldErrors: { firstName?: string; lastName?: string } = {}
    if (!firstName.trim()) nextFieldErrors.firstName = 'Please enter your first name.'
    if (!lastName.trim()) nextFieldErrors.lastName = 'Please enter your last name.'
    setFieldErrors(nextFieldErrors)
    if (nextFieldErrors.firstName || nextFieldErrors.lastName) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/rsvps/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          firstName,
          lastName,
          email,
          partySize: Number(partySize),
          website,
        }),
      })
      const data = (await res.json().catch(() => null)) as {
        url?: string
        error?: string
      } | null
      if (!res.ok || !data?.url) {
        setError(data?.error ?? 'Could not start checkout. Please try again.')
        return
      }
      window.location.assign(data.url)
    } catch {
      setError('Network error. Please check your connection and try again.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border-subtle bg-surface-raised p-8">
      <h2 className="font-display text-heading text-text-primary">RSVP — ${price}</h2>
      <p className="mt-1 text-body-sm text-text-muted">
        Per person. Your spot is confirmed once payment completes.
      </p>
      <div className="mt-6 flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            name="firstName"
            autoComplete="given-name"
            required
            maxLength={60}
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value)
              setFieldErrors((errors) => ({ ...errors, firstName: undefined }))
            }}
            error={fieldErrors.firstName}
          />
          <Input
            label="Last name"
            name="lastName"
            autoComplete="family-name"
            required
            maxLength={60}
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value)
              setFieldErrors((errors) => ({ ...errors, lastName: undefined }))
            }}
            error={fieldErrors.lastName}
          />
        </div>
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={320}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Select
          label="Tickets"
          name="partySize"
          value={partySize}
          onChange={(e) => setPartySize(e.target.value)}
        >
          {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
        {/* Honeypot */}
        <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
          <label>
            Website
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
        </div>
        {error && (
          <p role="alert" className="text-body-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" disabled={submitting} className="self-start">
          {submitting && <Spinner size="sm" />}
          {submitting ? 'Redirecting…' : `RSVP — $${price}`}
        </Button>
      </div>
    </form>
  )
}
