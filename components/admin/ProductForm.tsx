'use client'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import ImageUpload from '@/components/admin/ImageUpload'
import type { Product, ProductVariant } from '@/lib/shop'
import { parseUsdToCents } from '@/lib/money'
import { slugify } from '@/lib/admin/slug'

export type ProductFormProps = {
  /** Present when editing; absent when creating. */
  initial?: Product
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
] as const

type VariantDraft = {
  id: string
  name: string
  sku: string
  stock: string
  /** Dollars; empty means "use the product price". */
  price: string
}

function newVariantId(): string {
  return `v-${Math.random().toString(36).slice(2, 10)}`
}

function toDraft(variant: ProductVariant): VariantDraft {
  return {
    id: variant.id,
    name: variant.name,
    sku: variant.sku,
    stock: String(variant.stock),
    price: variant.priceCents !== undefined ? String(variant.priceCents / 100) : '',
  }
}

/** Create/edit form for shop products. Posts JSON to /api/admin/shop/products. */
export default function ProductForm({ initial }: ProductFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(initial))
  const [description, setDescription] = useState(initial?.description ?? '')
  const [images, setImages] = useState<string[]>(initial?.images ?? [])
  const [priceDollars, setPriceDollars] = useState(initial ? String(initial.priceCents / 100) : '')
  const [category, setCategory] = useState(initial?.category ?? 'Apparel')
  const [variants, setVariants] = useState<VariantDraft[]>(
    initial?.variants.map(toDraft) ?? [
      { id: newVariantId(), name: '', sku: '', stock: '0', price: '' },
    ]
  )
  const [status, setStatus] = useState<string>(initial?.status ?? 'draft')
  const [featured, setFeatured] = useState(initial?.featured ?? false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((current) =>
      current.map((variant, i) => (i === index ? { ...variant, ...patch } : variant))
    )
  }

  function setImageAt(index: number, url: string) {
    setImages((current) => current.map((image, i) => (i === index ? url : image)))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const priceCents = parseUsdToCents(priceDollars)
    if (priceCents === null || priceCents < 1) {
      setError('Price must be a dollar amount like 25 or 25.00.')
      return
    }

    const parsedVariants: ProductVariant[] = []
    for (const draft of variants) {
      if (draft.name.trim() === '') {
        setError('Every variant needs a name (e.g. "Small").')
        return
      }
      const stock = Number.parseInt(draft.stock, 10)
      if (!Number.isInteger(stock) || stock < 0) {
        setError(`Stock for "${draft.name}" must be a whole number, 0 or more.`)
        return
      }
      let priceOverride: number | undefined
      if (draft.price.trim() !== '') {
        const cents = parseUsdToCents(draft.price)
        if (cents === null || cents < 1) {
          setError(`Price override for "${draft.name}" must be a dollar amount like 25 or 25.00.`)
          return
        }
        priceOverride = cents
      }
      parsedVariants.push({
        id: draft.id,
        name: draft.name.trim(),
        sku: draft.sku.trim(),
        stock,
        ...(priceOverride !== undefined ? { priceCents: priceOverride } : {}),
      })
    }

    setSaving(true)
    try {
      const url = initial ? `/api/admin/shop/products/${initial.id}` : '/api/admin/shop/products'
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          description,
          images: images.filter((image) => image.trim() !== ''),
          priceCents,
          category: category.trim(),
          variants: parsedVariants,
          fulfillmentMethod: 'pickup',
          status,
          featured,
        }),
      })
      const data = (await response.json()) as { error?: string }
      if (!response.ok) {
        setError(data.error ?? 'Could not save the product.')
        return
      }
      router.push('/admin/shop')
      router.refresh()
    } catch {
      setError('Could not save the product. Please try again.')
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
        hint="Used in the public URL: /shop/your-slug"
        onChange={(event) => {
          setSlugTouched(true)
          setSlug(event.target.value)
        }}
      />
      <Textarea
        label="Description"
        rows={5}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />

      <div className="flex flex-col gap-4">
        <span className="text-body-sm font-semibold text-text-primary">Images</span>
        {images.map((image, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <ImageUpload
                name={`image-${index}`}
                label={`Image ${index + 1}`}
                value={image}
                onChange={(url) => setImageAt(index, url)}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Remove image ${index + 1}`}
              onClick={() => setImages((current) => current.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
        ))}
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setImages((current) => [...current, ''])}
          >
            <Plus className="size-4" aria-hidden />
            Add image
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Input
          label="Price (USD)"
          required
          inputMode="decimal"
          placeholder="25.00"
          value={priceDollars}
          onChange={(event) => setPriceDollars(event.target.value)}
        />
        <Input
          label="Category"
          required
          placeholder="Apparel"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className="text-body-sm font-semibold text-text-primary">
          Variants (sizes, colors…)
        </legend>
        {variants.map((variant, index) => (
          <div
            key={variant.id}
            className="grid items-end gap-4 border border-border-subtle bg-surface-raised p-4 sm:grid-cols-[1fr_8rem_6rem_8rem_auto]"
          >
            <Input
              label="Name"
              required
              placeholder="Small"
              value={variant.name}
              onChange={(event) => updateVariant(index, { name: event.target.value })}
            />
            <Input
              label="SKU"
              value={variant.sku}
              onChange={(event) => updateVariant(index, { sku: event.target.value })}
            />
            <Input
              label="Stock"
              required
              type="number"
              min={0}
              value={variant.stock}
              onChange={(event) => updateVariant(index, { stock: event.target.value })}
            />
            <Input
              label="Price override"
              inputMode="decimal"
              placeholder="—"
              value={variant.price}
              hint="USD, optional"
              onChange={(event) => updateVariant(index, { price: event.target.value })}
            />
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Remove variant ${variant.name || index + 1}`}
              disabled={variants.length === 1}
              onClick={() => setVariants((current) => current.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
        ))}
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setVariants((current) => [
                ...current,
                { id: newVariantId(), name: '', sku: '', stock: '0', price: '' },
              ])
            }
          >
            <Plus className="size-4" aria-hidden />
            Add variant
          </Button>
        </div>
      </fieldset>

      <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <Checkbox
        label="Featured product"
        hint="Featured products sort first in the shop grid."
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
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create product'}
        </Button>
        <Button href="/admin/shop" variant="ghost">
          Cancel
        </Button>
      </div>
    </form>
  )
}
