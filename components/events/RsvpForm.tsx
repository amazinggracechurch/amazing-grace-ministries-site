'use client'

import { useState, type FormEvent } from 'react'
import { CalendarCheck, Copy, Check } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Spinner from '@/components/ui/Spinner'

/**
 * Free-event RSVP form. Posts to /api/rsvps; on success the form is
 * replaced by a designed confirmation state that always shows the signed
 * manage link (email is best-effort, so non-email users aren't stranded).
 */

type DoneState = {
  status: 'confirmed' | 'waitlist'
  manageUrl: string
  spotsLeft: number | null
}

export default function RsvpForm({
  eventId,
  eventTitle,
  spotsLeft: initialSpotsLeft,
}: {
  eventId: string
  eventTitle: string
  spotsLeft: number | null
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [partySize, setPartySize] = useState('1')
  const [notes, setNotes] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<DoneState | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/rsvps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          name,
          email,
          phone,
          partySize: Number(partySize),
          notes,
          website,
        }),
      })
      const data = (await res.json().catch(() => null)) as {
        status?: 'confirmed' | 'waitlist'
        manageUrl?: string
        spotsLeft?: number | null
        error?: string
      } | null
      if (!res.ok) {
        setError(data?.error ?? 'Something went wrong. Please try again.')
        return
      }
      setDone({
        status: data?.status === 'waitlist' ? 'waitlist' : 'confirmed',
        manageUrl: data?.manageUrl ?? '',
        spotsLeft: typeof data?.spotsLeft === 'number' ? data.spotsLeft : null,
      })
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="border border-border-subtle bg-surface-raised p-8">
        <div className="flex size-12 items-center justify-center bg-accent-subtle text-accent">
          <CalendarCheck className="size-6" aria-hidden />
        </div>
        <h2 className="mt-4 font-display text-heading text-text-primary">
          {done.status === 'waitlist' ? "You're on the waitlist" : "You're on the list"}
        </h2>
        <p className="mt-3 text-body-sm text-text-secondary">
          {done.status === 'waitlist'
            ? `${eventTitle} is at capacity, so we've saved a waitlist spot for your party. We'll email you if a spot opens up.`
            : `Your RSVP for ${eventTitle} is confirmed. A confirmation email with a calendar invite is on its way.`}
        </p>
        {done.manageUrl && (
          <div className="mt-6 border-t border-border-subtle pt-5">
            <p className="text-caption font-semibold text-text-muted">
              Save this link to review or cancel your RSVP:
            </p>
            <div className="mt-2 flex items-center gap-2">
              <a
                href={done.manageUrl}
                className="min-w-0 flex-1 truncate text-body-sm font-semibold text-accent underline-offset-4 hover:underline"
              >
                {done.manageUrl}
              </a>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(done.manageUrl).then(() => {
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  })
                }}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1 border border-border-strong px-3 py-1.5 text-caption font-semibold text-text-secondary transition-colors duration-200 hover:border-accent hover:text-accent"
              >
                {copied ? (
                  <Check className="size-3.5" aria-hidden />
                ) : (
                  <Copy className="size-3.5" aria-hidden />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border-subtle bg-surface-raised p-8">
      <h2 className="font-display text-heading text-text-primary">RSVP</h2>
      {initialSpotsLeft !== null && (
        <p className="mt-1 text-body-sm text-text-muted">
          {initialSpotsLeft > 0
            ? `${initialSpotsLeft} ${initialSpotsLeft === 1 ? 'spot' : 'spots'} left`
            : 'At capacity — new RSVPs join the waitlist'}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-5">
        <Input
          label="Name"
          name="name"
          autoComplete="name"
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
        <Input
          label="Phone (optional)"
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength={40}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Select
          label="Party size"
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
        <Textarea
          label="Notes (optional)"
          name="notes"
          rows={3}
          maxLength={1000}
          hint="Allergies, accessibility needs, anything we should know."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        {/* Honeypot — hidden from humans, tempting to bots. */}
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
          {submitting ? 'Saving…' : 'Submit RSVP'}
        </Button>
      </div>
    </form>
  )
}
