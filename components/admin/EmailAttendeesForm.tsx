'use client'
import { useState, type FormEvent } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'

export type EmailAttendeesFormProps = {
  eventId: string
  confirmedCount: number
}

/** "Email all attendees" — posts to /api/admin/events/email. */
export default function EmailAttendeesForm({ eventId, confirmedCount }: EmailAttendeesFormProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setResult(null)
    setSending(true)
    try {
      const response = await fetch('/api/admin/events/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, subject, body }),
      })
      const data = (await response.json()) as {
        error?: string
        recipients?: number
        sent?: number
        failed?: number
      }
      if (!response.ok) {
        setError(data.error ?? 'Could not send the email.')
        return
      }
      setResult(
        `Sent to ${data.sent ?? 0} of ${data.recipients ?? 0} confirmed attendees` +
          (data.failed ? ` (${data.failed} failed — email may not be configured).` : '.')
      )
      setSubject('')
      setBody('')
    } catch {
      setError('Could not send the email. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Input
        label="Subject"
        required
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
      />
      <Textarea
        label="Message"
        required
        rows={8}
        value={body}
        hint={`Goes to the ${confirmedCount} confirmed attendee${confirmedCount === 1 ? '' : 's'} as individual emails.`}
        onChange={(event) => setBody(event.target.value)}
      />
      {error && (
        <p role="alert" className="text-body-sm text-danger">
          {error}
        </p>
      )}
      {result && <p className="text-body-sm text-success">{result}</p>}
      <div>
        <Button type="submit" variant="primary" disabled={sending || confirmedCount === 0}>
          {sending ? 'Sending…' : 'Send to confirmed attendees'}
        </Button>
      </div>
    </form>
  )
}
