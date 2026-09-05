'use client'
import Image from 'next/image'
import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

export type ImageUploadProps = {
  /** Field name for the hidden input carrying the resulting URL. */
  name: string
  label: string
  value: string
  onChange: (url: string) => void
  hint?: string
}

/**
 * Shared admin image picker: paste a URL directly or upload a file to
 * Firebase Storage via /api/admin/upload. The resulting URL is reported
 * through onChange and mirrored into a hidden input so plain form posts
 * carry it too.
 */
export default function ImageUpload({ name, label, value, onChange, hint }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const response = await fetch('/api/admin/upload', { method: 'POST', body: form })
      const data = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || !data.url) {
        setError(data.error ?? 'Upload failed. Please try again.')
        return
      }
      onChange(data.url)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-body-sm font-semibold text-text-primary">{label}</span>
      {value && (
        <div className="relative h-32 w-56 overflow-hidden border border-border-subtle bg-surface-sunken">
          <Image src={value} alt={`${label} preview`} fill className="object-cover" unoptimized />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="url"
          aria-label={`${label} URL`}
          placeholder="https://…"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 border border-border-subtle bg-surface-raised px-3 py-2 text-body text-text-primary transition-colors duration-200 placeholder:text-text-muted focus:border-accent"
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Spinner size="sm" />
          ) : (
            <UploadCloud className="size-4" aria-hidden="true" />
          )}
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label={`Upload ${label}`}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
      </div>
      {hint && <p className="text-caption text-text-muted">{hint}</p>}
      {error && (
        <p role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}
      {/* Mirrors the URL for non-JS form posts; React forms read state. */}
      <input type="hidden" name={name} value={value} />
    </div>
  )
}
