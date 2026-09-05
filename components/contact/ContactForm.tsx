'use client'
import { useState, type FormEvent } from 'react'
import { Check, Send } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import { departments, type DepartmentName } from './departments'
import type { SiteSettings } from '@/lib/admin/site-settings'

type ContactFormProps = {
  contact: SiteSettings['contact']
}

type Fields = {
  firstName: string
  lastName: string
  email: string
  phone: string
  department: DepartmentName | ''
  subject: string
  message: string
  /** Honeypot — must stay empty. Bots fill it; humans never see it. */
  website: string
}

type FieldKey = Exclude<keyof Fields, 'website'>
type FieldErrors = Partial<Record<FieldKey, string>>

type Status = 'idle' | 'submitting' | 'success' | 'unavailable'

const emptyFields: Fields = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  department: '',
  subject: '',
  message: '',
  website: '',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(fields: Fields): FieldErrors {
  const errors: FieldErrors = {}
  if (!fields.firstName.trim()) errors.firstName = 'Please enter your first name.'
  if (!fields.lastName.trim()) errors.lastName = 'Please enter your last name.'
  if (!EMAIL_RE.test(fields.email.trim()))
    errors.email = 'Please enter a valid email address.'
  if (!fields.department) errors.department = 'Please select a department.'
  if (!fields.subject.trim()) errors.subject = 'Please enter a subject.'
  if (!fields.message.trim()) errors.message = 'Please enter your message.'
  return errors
}

const errorSummaryId = 'contact-form-errors'

/**
 * Working contact form — posts to /api/contact. Client validation mirrors
 * the server's zod schema; errors surface per-field (role="alert" inside
 * Input/Textarea/Select) and in an aria-live summary. Success replaces the
 * form; a missing email backend shows a designed unavailable state with
 * phone/email alternatives instead of a bare failure.
 */
export default function ContactForm({ contact }: ContactFormProps) {
  const [fields, setFields] = useState<Fields>(emptyFields)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<Status>('idle')
  const [serverError, setServerError] = useState<string | null>(null)
  const phoneHref = `tel:+1${contact.phone.replace(/\D/g, '')}`

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => {
    setFields((prev) => ({ ...prev, [key]: value }))
    if (key !== 'website') {
      setErrors((prev) => {
        if (!prev[key as FieldKey]) return prev
        const next = { ...prev }
        delete next[key as FieldKey]
        return next
      })
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError(null)

    const fieldErrors = validate(fields)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setStatus('submitting')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })

      if (res.ok) {
        setStatus('success')
        return
      }

      const data: { error?: string; issues?: Record<string, string[]> } = await res
        .json()
        .catch(() => ({}))

      if (res.status === 503 && data.error === 'email_not_configured') {
        setStatus('unavailable')
        return
      }
      if (res.status === 400 && data.issues) {
        const mapped: FieldErrors = {}
        for (const [key, messages] of Object.entries(data.issues)) {
          if (key in fields && messages?.[0] && key !== 'website') {
            mapped[key as FieldKey] = messages[0]
          }
        }
        setErrors(mapped)
        setStatus('idle')
        return
      }
      if (res.status === 429) {
        setServerError(
          'You have sent several messages recently. Please try again in a little while — or reach us directly by phone or email below.'
        )
        setStatus('idle')
        return
      }
      setServerError(
        'Something went wrong while sending your message. Please try again — or reach us directly by phone or email below.'
      )
      setStatus('idle')
    } catch {
      setServerError(
        'Your message could not be sent. Please check your connection and try again — or reach us directly by phone or email below.'
      )
      setStatus('idle')
    }
  }

  function handleReset() {
    setFields(emptyFields)
    setErrors({})
    setServerError(null)
    setStatus('idle')
  }

  /* ---- Success replaces the form entirely ---- */
  if (status === 'success') {
    return (
      <div className="border border-border-subtle bg-surface-raised p-8 text-center md:p-12" aria-live="polite">
        <div className="mx-auto flex size-14 items-center justify-center border border-success text-success">
          <Check className="size-7" aria-hidden />
        </div>
        <h3 className="mt-6 font-display text-display-md font-medium tracking-display text-text-primary">
          Message Sent!
        </h3>
        <p className="mx-auto mt-4 max-w-md text-body text-text-secondary">
          Thank you for reaching out. Someone from our team will get back to you within
          24&ndash;48 hours. God bless you!
        </p>
        <div className="mt-8">
          <Button variant="link" onClick={handleReset}>
            Send Another Message &rarr;
          </Button>
        </div>
      </div>
    )
  }

  /* ---- Email backend not configured: designed alternative, never a bare failure ---- */
  if (status === 'unavailable') {
    return (
      <div className="border border-border-subtle bg-surface-raised p-8 md:p-12" aria-live="polite">
        <p className="eyebrow text-accent">We&apos;re still here</p>
        <h3 className="mt-4 font-display text-heading font-medium text-text-primary">
          Our contact form is temporarily unavailable.
        </h3>
        <p className="mt-4 max-w-md text-body text-text-secondary">
          We&apos;re sorry — messages can&apos;t be sent through the form right now. You can
          still reach us directly, and we&apos;d love to hear from you:
        </p>
        <ul className="mt-6 border-t border-border-subtle">
          <li className="border-b border-border-subtle py-4">
            <p className="eyebrow text-text-muted">Call us</p>
            <a
              href={phoneHref}
              className="mt-1 block text-subheading font-semibold text-text-primary underline-offset-4 transition-colors duration-200 hover:text-accent hover:underline"
            >
              {contact.phone}
            </a>
          </li>
          <li className="border-b border-border-subtle py-4">
            <p className="eyebrow text-text-muted">Email us</p>
            <a
              href={`mailto:${contact.email}`}
              className="mt-1 block text-subheading font-semibold text-text-primary underline-offset-4 transition-colors duration-200 hover:text-accent hover:underline"
            >
              {contact.email}
            </a>
          </li>
        </ul>
        <div className="mt-8">
          <Button variant="secondary" onClick={() => setStatus('idle')}>
            Try the form again
          </Button>
        </div>
      </div>
    )
  }

  const submitting = status === 'submitting'
  const errorCount = Object.keys(errors).length

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="border border-border-subtle bg-surface-raised p-6 md:p-8"
      aria-describedby={serverError ? 'contact-form-server-error' : undefined}
    >
      {/* Screen-reader status announcements */}
      <p aria-live="polite" className="sr-only">
        {submitting ? 'Sending your message…' : ''}
      </p>

      {/* Validation summary */}
      {errorCount > 0 && (
        <div
          id={errorSummaryId}
          role="alert"
          className="mb-6 border border-danger bg-surface p-4"
        >
          <p className="text-body-sm font-semibold text-danger">
            Please review {errorCount === 1 ? 'this field' : `these ${errorCount} fields`}{' '}
            before sending:
          </p>
          <ul className="mt-2 list-inside list-disc text-body-sm text-text-secondary">
            {Object.values(errors).map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Server / network failure — form stays filled */}
      {serverError && (
        <div
          id="contact-form-server-error"
          role="alert"
          className="mb-6 border border-danger bg-surface p-4"
        >
          <p className="text-body-sm font-semibold text-danger">{serverError}</p>
          <p className="mt-2 text-body-sm text-text-secondary">
            <a
              href={phoneHref}
              className="font-semibold underline-offset-4 hover:underline"
            >
              {contact.phone}
            </a>{' '}
            ·{' '}
            <a
              href={`mailto:${contact.email}`}
              className="font-semibold underline-offset-4 hover:underline"
            >
              {contact.email}
            </a>
          </p>
        </div>
      )}

      {/* Honeypot — visually hidden, out of tab order; only bots fill it */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={fields.website}
          onChange={(e) => set('website', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="First Name"
          type="text"
          required
          autoComplete="given-name"
          placeholder="John"
          value={fields.firstName}
          onChange={(e) => set('firstName', e.target.value)}
          error={errors.firstName}
          disabled={submitting}
        />
        <Input
          label="Last Name"
          type="text"
          required
          autoComplete="family-name"
          placeholder="Doe"
          value={fields.lastName}
          onChange={(e) => set('lastName', e.target.value)}
          error={errors.lastName}
          disabled={submitting}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Email Address"
          type="email"
          required
          autoComplete="email"
          placeholder="john.doe@example.com"
          value={fields.email}
          onChange={(e) => set('email', e.target.value)}
          error={errors.email}
          disabled={submitting}
        />
        <Input
          label="Phone Number (Optional)"
          type="tel"
          autoComplete="tel"
          placeholder="(651) 555-0100"
          value={fields.phone}
          onChange={(e) => set('phone', e.target.value)}
          error={errors.phone}
          disabled={submitting}
        />
      </div>

      <div className="mt-4">
        <Select
          label="Department"
          required
          value={fields.department}
          onChange={(e) => set('department', e.target.value as DepartmentName)}
          error={errors.department}
          disabled={submitting}
        >
          <option value="" disabled>
            Select a department...
          </option>
          {departments.map((dept) => (
            <option key={dept.name} value={dept.name}>
              {dept.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-4">
        <Input
          label="Subject"
          type="text"
          required
          placeholder="How can we help?"
          value={fields.subject}
          onChange={(e) => set('subject', e.target.value)}
          error={errors.subject}
          disabled={submitting}
        />
      </div>

      <div className="mt-4">
        <Textarea
          label="Your Message"
          required
          rows={6}
          placeholder="How can we help you?"
          value={fields.message}
          onChange={(e) => set('message', e.target.value)}
          error={errors.message}
          disabled={submitting}
        />
      </div>

      <div className="mt-6">
        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting ? <Spinner size="sm" className="text-on-accent" /> : <Send className="size-4" aria-hidden />}
          {submitting ? 'Sending…' : 'Send Message'}
        </Button>
      </div>

      <p className="mt-4 text-center text-caption text-text-muted">
        Your information is kept private and never shared.
      </p>
    </form>
  )
}
