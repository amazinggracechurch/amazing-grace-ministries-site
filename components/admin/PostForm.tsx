'use client'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import ImageUpload from '@/components/admin/ImageUpload'
import BlockEditor from '@/components/admin/BlockEditor'
import type { AdminPost } from '@/lib/admin/posts'
import type { Block } from '@/lib/posts/blocks'
import { slugify } from '@/lib/admin/slug'
import { isoToChurchLocal } from '@/lib/admin/chicago-time'

export type PostFormProps = {
  initial?: AdminPost
}

const TYPE_OPTIONS = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'sermon', label: 'Sermon text' },
] as const

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
] as const

/** Blog post editor: metadata + structured block body. */
export default function PostForm({ initial }: PostFormProps) {
  const router = useRouter()
  const [type, setType] = useState<string>(initial?.type ?? 'announcement')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(initial))
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '')
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? '')
  const [authorName, setAuthorName] = useState(initial?.authorName ?? '')
  const [speaker, setSpeaker] = useState(initial?.speaker ?? '')
  const [scriptureRef, setScriptureRef] = useState(initial?.scriptureRef ?? '')
  const [series, setSeries] = useState(initial?.series ?? '')
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '')
  const [status, setStatus] = useState<string>(initial?.status ?? 'draft')
  const [publishAt, setPublishAt] = useState(
    initial ? isoToChurchLocal(initial.publishAt) : isoToChurchLocal(new Date().toISOString())
  )
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? '')
  const [blocks, setBlocks] = useState<Block[]>(initial?.body ?? [])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(initial ? { id: initial.id } : {}),
          type,
          title,
          slug,
          excerpt,
          body: blocks,
          coverImage,
          authorName,
          speaker,
          scriptureRef,
          series,
          tags: tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
          status,
          publishAt,
          seoDescription,
        }),
      })
      const data = (await response.json()) as { error?: string }
      if (!response.ok) {
        setError(data.error ?? 'Could not save the post.')
        return
      }
      router.push('/admin/blog')
      router.refresh()
    } catch {
      setError('Could not save the post. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 flex max-w-3xl flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Select label="Type" value={type} onChange={(event) => setType(event.target.value)}>
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
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
        hint="Used in the public URL: /blog/your-slug"
        onChange={(event) => {
          setSlugTouched(true)
          setSlug(event.target.value)
        }}
      />
      <Textarea
        label="Excerpt"
        rows={3}
        value={excerpt}
        hint="Short summary shown on cards and listings."
        onChange={(event) => setExcerpt(event.target.value)}
      />
      <ImageUpload
        name="coverImage"
        label="Cover image"
        value={coverImage}
        onChange={setCoverImage}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <Input
          label="Author name"
          required
          value={authorName}
          onChange={(event) => setAuthorName(event.target.value)}
        />
        <Input
          label="Speaker"
          value={speaker}
          hint="Sermons only."
          onChange={(event) => setSpeaker(event.target.value)}
        />
        <Input
          label="Scripture reference"
          placeholder="Genesis 28:16"
          value={scriptureRef}
          onChange={(event) => setScriptureRef(event.target.value)}
        />
        <Input
          label="Series"
          value={series}
          onChange={(event) => setSeries(event.target.value)}
        />
      </div>
      <Input
        label="Tags"
        value={tags}
        hint="Comma-separated, e.g. faith, prayer, community."
        onChange={(event) => setTags(event.target.value)}
      />
      <Input
        label="Publish at"
        type="datetime-local"
        required
        value={publishAt}
        hint="Church time (America/Chicago). Scheduled posts go live at this time."
        onChange={(event) => setPublishAt(event.target.value)}
      />
      <Textarea
        label="SEO description"
        rows={2}
        value={seoDescription}
        hint="Optional. Falls back to the excerpt."
        onChange={(event) => setSeoDescription(event.target.value)}
      />

      <div className="border-t border-border-subtle pt-6">
        <BlockEditor value={blocks} onChange={setBlocks} />
      </div>

      {error && (
        <p role="alert" className="text-body-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create post'}
        </Button>
        <Button href="/admin/blog" variant="ghost">
          Cancel
        </Button>
      </div>
    </form>
  )
}
