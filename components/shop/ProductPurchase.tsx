'use client'
import { useMemo, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import { formatUsd } from '@/lib/money'
import type { Product } from '@/lib/shop'
import { useCart } from './CartProvider'

export type ProductPurchaseProps = {
  product: Product
}

/**
 * Variant picker + quantity + add-to-cart for the PDP. Out-of-stock
 * variants are unselectable; quantity is capped at the variant's stock.
 * Prices honor the per-variant priceCents override.
 */
export default function ProductPurchase({ product }: ProductPurchaseProps) {
  const { addItem } = useCart()
  const firstAvailable = product.variants.find((variant) => variant.stock > 0) ?? null
  const [variantId, setVariantId] = useState<string | null>(firstAvailable?.id ?? null)
  const [qty, setQty] = useState(1)

  const variant = useMemo(
    () => product.variants.find((candidate) => candidate.id === variantId) ?? null,
    [product.variants, variantId]
  )
  const priceCents = variant?.priceCents ?? product.priceCents
  const soldOut = product.variants.every((candidate) => candidate.stock === 0)

  function selectVariant(id: string, stock: number) {
    if (stock === 0) return
    setVariantId(id)
    setQty((current) => Math.min(Math.max(1, current), stock))
  }

  function handleAdd() {
    if (!variant || variant.stock === 0) return
    addItem({
      productId: product.id,
      variantId: variant.id,
      title: product.title,
      variantName: variant.name,
      slug: product.slug,
      image: product.images[0] ?? null,
      priceCents,
      qty,
      maxStock: variant.stock,
    })
  }

  return (
    <div>
      <p className="font-display text-display-md font-light tracking-display text-text-primary">
        {formatUsd(priceCents)}
      </p>

      <div className="mt-8">
        <p className="eyebrow text-text-muted">Options</p>
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Product options">
          {product.variants.map((candidate) => {
            const selected = candidate.id === variantId
            const available = candidate.stock > 0
            return (
              <button
                key={candidate.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!available}
                onClick={() => selectVariant(candidate.id, candidate.stock)}
                className={`border px-4 py-2 text-body-sm font-semibold transition-colors duration-200 ${
                  selected
                    ? 'border-accent bg-accent-subtle text-accent'
                    : available
                      ? 'border-border-strong text-text-secondary hover:border-accent hover:text-accent'
                      : 'cursor-not-allowed border-border-subtle text-text-muted line-through opacity-60'
                }`}
              >
                {candidate.name}
                {available && candidate.stock <= 3 && (
                  <span className="ml-2 text-caption font-normal text-warning">
                    Only {candidate.stock} left
                  </span>
                )}
                {!available && <span className="ml-2 text-caption font-normal">Sold out</span>}
              </button>
            )
          })}
        </div>
      </div>

      {!soldOut && variant && (
        <div className="mt-6 flex items-center gap-4">
          <p className="eyebrow text-text-muted">Quantity</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={qty <= 1}
              onClick={() => setQty((current) => Math.max(1, current - 1))}
              className="flex size-9 items-center justify-center border border-border-subtle text-text-secondary transition-colors duration-200 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <span className="min-w-8 text-center text-body font-semibold text-text-primary">
              {qty}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={qty >= variant.stock}
              onClick={() => setQty((current) => Math.min(variant.stock, current + 1))}
              className="flex size-9 items-center justify-center border border-border-subtle text-text-secondary transition-colors duration-200 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      )}

      <div className="mt-8">
        <Button
          variant="primary"
          size="lg"
          disabled={soldOut || !variant}
          onClick={handleAdd}
          className="w-full sm:w-auto"
        >
          {soldOut ? 'Sold out' : 'Add to Cart'}
        </Button>
        <p className="mt-4 text-caption text-text-muted">
          Pickup at Sunday service — 715 Edgerton Street, Saint Paul. No shipping, no tax.
        </p>
      </div>
    </div>
  )
}
