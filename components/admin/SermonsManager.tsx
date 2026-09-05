'use client'
import { useState, type FormEvent } from 'react'
import Button from '@/components/ui/Button'
import Textarea from '@/components/ui/Textarea'

export type SermonsManagerProps = {
  initialIds: string[]
}

type RefreshReport = { count: number; sermons: { id: string; title: string }[] }

/** Manual YouTube override list editor + cache refresh. */
export default function SermonsManager({ initialIds }: SermonsManagerProps) {
  const [text, setText] = useState(initialIds.join('\n'))
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [report, setReport] = useState<RefreshReport | null>(null)

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaveMessage(null)
    setSaving(true)
    try {
      const manualVideoIds = text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      const response = await fetch('/api/admin/sermons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualVideoIds }),
      })
      const data = (await response.json()) as { error?: string; count?: number }
      if (!response.ok) {
        setError(data.error ?? 'Could not save the list.')
        return
      }
      setSaveMessage(`Saved ${data.count ?? manualVideoIds.length} video IDs.`)
    } catch {
      setError('Could not save the list. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRefresh() {
    setError(null)
    setReport(null)
    setRefreshing(true)
    try {
      const response = await fetch('/api/admin/sermons/refresh', { method: 'POST' })
      const data = (await response.json()) as RefreshReport & { error?: string }
      if (!response.ok) {
        setError(data.error ?? 'Refresh failed.')
        return
      }
      setReport({ count: data.count, sermons: data.sermons })
    } catch {
      setError('Refresh failed. Please try again.')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="mt-10 flex max-w-3xl flex-col gap-10">
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <Textarea
          label="Manual video IDs"
          rows={8}
          value={text}
          hint="One YouTube video ID per line (the part after watch?v=). When this list is non-empty it replaces the automatic channel feed. Leave empty to use the channel's latest uploads."
          onChange={(event) => setText(event.target.value)}
        />
        {error && (
          <p role="alert" className="text-body-sm text-danger">
            {error}
          </p>
        )}
        {saveMessage && <p className="text-body-sm text-success">{saveMessage}</p>}
        <div>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save list'}
          </Button>
        </div>
      </form>

      <div className="border-t border-border-subtle pt-10">
        <h2 className="font-display text-heading tracking-display text-text-primary">
          Cache
        </h2>
        <p className="mt-2 text-body-sm text-text-secondary">
          Sermons are cached for an hour on the public site. Refresh to pull the latest list
          now and see what the site will show.
        </p>
        <div className="mt-4">
          <Button variant="secondary" disabled={refreshing} onClick={handleRefresh}>
            {refreshing ? 'Refreshing…' : 'Refresh cache'}
          </Button>
        </div>
        {report && (
          <div className="mt-6">
            <p className="text-body-sm font-semibold text-text-primary">
              Fetched {report.count} sermon{report.count === 1 ? '' : 's'}:
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {report.sermons.map((sermon) => (
                <li key={sermon.id} className="text-body-sm text-text-secondary">
                  {sermon.title}{' '}
                  <span className="text-caption text-text-muted">({sermon.id})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
