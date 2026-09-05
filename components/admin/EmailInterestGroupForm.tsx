'use client'
import { useState, type FormEvent } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { INTEREST_GROUPS } from '@/lib/member-groups'

/** "Email interest group" — posts to /api/admin/members/email. */
export default function EmailInterestGroupForm() {
  const [interest, setInterest] = useState('all')
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
      const response = await fetch('/api/admin/members/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interest, subject, body }),
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
        `Sent to ${data.sent ?? 0} of ${data.recipients ?? 0} members` +
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
      <Select
        label="Interest group"
        value={interest}
        onChange={(event) => setInterest(event.target.value)}
      >
        <option value="all">All members</option>
        {INTEREST_GROUPS.map((group) => (
          <option key={group} value={group}>
            {group}
          </option>
        ))}
      </Select>
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
        hint="Goes to each member in the group as an individual email. Members who opted out of email updates are skipped."
        onChange={(event) => setBody(event.target.value)}
      />
      {error && (
        <p role="alert" className="text-body-sm text-danger">
          {error}
        </p>
      )}
      {result && <p className="text-body-sm text-success">{result}</p>}
      <div>
        <Button type="submit" variant="primary" disabled={sending}>
          {sending ? 'Sending…' : 'Send to group'}
        </Button>
      </div>
    </form>
  )
}
