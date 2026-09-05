import Image from 'next/image'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import { formatUsd } from '@/lib/money'
import { totalStock, type Product } from '@/lib/shop'

/**
 * Grid tile for /shop. Products without photography get a typographic
 * tile (display-type initial on a sunken surface) — never a gray box.
 */
export default function ProductCard({ product }: { product: Product }) {
  const soldOut = totalStock(product) === 0
  const image = product.images[0] ?? null

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden border border-border-subtle bg-surface-sunken">
        {image ? (
          <Image
            src={image}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="font-display text-display-md font-light tracking-display text-text-muted">
              {product.title.charAt(0)}
            </span>
            <span className="eyebrow text-text-muted">{product.category}</span>
          </div>
        )}
        {soldOut && (
          <div className="absolute left-3 top-3">
            <Badge variant="neutral">Sold out</Badge>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-heading font-medium tracking-display text-text-primary transition-colors duration-200 group-hover:text-accent">
          {product.title}
        </h3>
        <p className="shrink-0 text-body font-semibold text-text-primary">
          {formatUsd(product.priceCents)}
        </p>
      </div>
      <p className="mt-1 text-caption uppercase tracking-eyebrow text-text-muted">
        {product.category}
      </p>
    </Link>
  )
}
