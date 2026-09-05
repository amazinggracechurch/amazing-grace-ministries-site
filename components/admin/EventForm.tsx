'use client'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import ImageUpload from '@/components/admin/ImageUpload'
import type { ChurchEvent } from '@/lib/events'
import { parseUsdToCents } from '@/lib/money'
import { slugify } from '@/lib/admin/slug'
import { CHURCH_TIMEZONE, isoToChurchLocal } from '@/lib/admin/chicago-time'

export type EventFormProps = {
  initial?: ChurchEvent
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

/** Create/edit form for events. Times are church-local (America/Chicago). */
export default function EventForm({ initial }: EventFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(initial))
  const [description, setDescription] = useState(initial?.description ?? '')
  const [flyerImage, setFlyerImage] = useState(initial?.flyerImage ?? '')
  const [startAt, setStartAt] = useState(initial ? isoToChurchLocal(initial.startAt) : '')
  const [endAt, setEndAt] = useState(initial?.endAt ? isoToChurchLocal(initial.endAt) : '')
  const [locationName, setLocationName] = useState(initial?.location.name ?? '')
  const [locationAddress, setLocationAddress] = useState(initial?.location.address ?? '')
  const [capacity, setCapacity] = useState(initial?.capacity != null ? String(initial.capacity) : '')
  const [priceDollars, setPriceDollars] = useState(
    initial?.priceCents ? String(initial.priceCents / 100) : ''
  )
  const [status, setStatus] = useState<string>(initial?.status ?? 'draft')
  const [featured, setFeatured] = useState(initial?.featured ?? false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!startAt) {
      setError('Start date and time is required.')
      return
    }
    let priceCents: number | '' = ''
    if (priceDollars.trim() !== '') {
      const parsedPrice = parseUsdToCents(priceDollars)
      if (parsedPrice === null) {
        setError('Price must be a dollar amount like 25 or 25.00 (or empty for free).')
        return
      }
      priceCents = parsedPrice
    }
    const capacityValue =
      capacity.trim() === '' ? '' : Number.parseInt(capacity, 10)
    if (capacityValue !== '' && (!Number.isSafeInteger(capacityValue) || capacityValue < 0)) {
      setError('Capacity must be a whole number (or empty for unlimited).')
      return
    }

    setSaving(true)
    try {
      const url = initial ? `/api/admin/events/${initial.id}` : '/api/admin/events'
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          description,
          flyerImage,
          startAt,
          endAt,
          locationName,
          locationAddress,
          capacity: capacityValue,
          priceCents,
          status,
          featured,
        }),
      })
      const data = (await response.json()) as { error?: string }
      if (!response.ok) {
        setError(data.error ?? 'Could not save the event.')
        return
      }
      router.push('/admin/events')
      router.refresh()
    } catch {
      setError('Could not save the event. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 flex max-w-3xl flex-col gap-6">
      <Input
        label="Title"
        required
        value={title}
        onChange={(event) => handleTitleChange(event.target.value)}
      />
      <Input
        label="Slug"
        required
        value={slug}
        hint="Used in the public URL: /events/your-slug"
        onChange={(event) => {
          setSlugTouched(true)
          setSlug(event.target.value)
        }}
      />
      <Textarea
        label="Description"
        rows={6}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <ImageUpload
        name="flyerImage"
        label="Flyer image"
        value={flyerImage}
        onChange={setFlyerImage}
        hint="Paste a URL or upload an image (max 10 MB)."
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <Input
          label="Starts"
          type="datetime-local"
          required
          value={startAt}
          hint={`Church time (${CHURCH_TIMEZONE}).`}
          onChange={(event) => setStartAt(event.target.value)}
        />
        <Input
          label="Ends"
          type="datetime-local"
          value={endAt}
          hint="Optional."
          onChange={(event) => setEndAt(event.target.value)}
        />
        <Input
          label="Location name"
          placeholder="Main Sanctuary"
          value={locationName}
          onChange={(event) => setLocationName(event.target.value)}
        />
        <Input
          label="Location address"
          placeholder="715 Edgerton Street, Saint Paul, MN"
          value={locationAddress}
          onChange={(event) => setLocationAddress(event.target.value)}
        />
        <Input
          label="Capacity"
          type="number"
          min={0}
          value={capacity}
          hint="Total seats. Empty = unlimited."
          onChange={(event) => setCapacity(event.target.value)}
        />
        <Input
          label="Price per seat (USD)"
          inputMode="decimal"
          placeholder="25.00"
          value={priceDollars}
          hint="Empty or 0 = free event."
          onChange={(event) => setPriceDollars(event.target.value)}
        />
      </div>
      <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <Checkbox
        label="Featured event"
        checked={featured}
        onChange={(event) => setFeatured(event.target.checked)}
      />
      {error && (
        <p role="alert" className="text-body-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create event'}
        </Button>
        <Button href="/admin/events" variant="ghost">
          Cancel
        </Button>
      </div>
    </form>
  )
}
