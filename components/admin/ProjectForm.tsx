'use client'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import ImageUpload from '@/components/admin/ImageUpload'
import type { Project } from '@/lib/projects'
import { parseUsdToCents } from '@/lib/money'
import { slugify } from '@/lib/admin/slug'

export type ProjectFormProps = {
  /** Present when editing; absent when creating. */
  initial?: Project
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'funded', label: 'Funded' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
] as const

/** Create/edit form for funding projects. Posts JSON to /api/admin/projects. */
export default function ProjectForm({ initial }: ProjectFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(initial))
  const [description, setDescription] = useState(initial?.description ?? '')
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? '')
  const [goalDollars, setGoalDollars] = useState(
    initial ? String(initial.goalAmountCents / 100) : ''
  )
  const [startDate, setStartDate] = useState(initial?.startDate?.slice(0, 10) ?? '')
  const [endDate, setEndDate] = useState(initial?.endDate?.slice(0, 10) ?? '')
  const [status, setStatus] = useState<string>(initial?.status ?? 'draft')
  const [featured, setFeatured] = useState(initial?.featured ?? false)
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const goalAmountCents = parseUsdToCents(goalDollars)
    if (goalAmountCents === null) {
      setError('Goal amount must be a dollar amount like 25000 or 25000.00.')
      return
    }

    setSaving(true)
    try {
      const url = initial ? `/api/admin/projects/${initial.id}` : '/api/admin/projects'
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          description,
          coverImage,
          goalAmountCents,
          startDate,
          endDate,
          status,
          featured,
          sortOrder: Number.parseInt(sortOrder, 10) || 0,
        }),
      })
      const data = (await response.json()) as { error?: string }
      if (!response.ok) {
        setError(data.error ?? 'Could not save the project.')
        return
      }
      router.push('/admin/projects')
      router.refresh()
    } catch {
      setError('Could not save the project. Please try again.')
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
        hint="Used in the public URL: /projects/your-slug"
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
        name="coverImage"
        label="Cover image"
        value={coverImage}
        onChange={setCoverImage}
        hint="Paste a URL or upload an image (max 10 MB)."
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <Input
          label="Goal amount (USD)"
          required
          inputMode="decimal"
          placeholder="25000"
          value={goalDollars}
          onChange={(event) => setGoalDollars(event.target.value)}
        />
        <Input
          label="Sort order"
          type="number"
          min={0}
          value={sortOrder}
          hint="Lower numbers appear first."
          onChange={(event) => setSortOrder(event.target.value)}
        />
        <Input
          label="Start date"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
        <Input
          label="End date"
          type="date"
          value={endDate}
          hint="Leave empty for an open-ended campaign."
          onChange={(event) => setEndDate(event.target.value)}
        />
      </div>
      <Select
        label="Status"
        value={status}
        onChange={(event) => setStatus(event.target.value)}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <Checkbox
        label="Featured project"
        hint="Featured active campaigns can be highlighted on the home page."
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
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create project'}
        </Button>
        <Button href="/admin/projects" variant="ghost">
          Cancel
        </Button>
      </div>
    </form>
  )
}
