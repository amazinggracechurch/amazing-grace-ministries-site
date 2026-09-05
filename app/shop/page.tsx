import type { Metadata } from 'next'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import Section from '@/components/layout/Section'
import EmptyState from '@/components/ui/EmptyState'
import Reveal from '@/components/ui/Reveal'
import ProductCard from '@/components/shop/ProductCard'
import { listActiveCategories, listActiveProducts, type Product } from '@/lib/shop'
import { cn } from '@/lib/cn'

export const metadata: Metadata = {
  title: 'Shop | Amazing Grace Ministries MN',
  description:
    'Merch from Amazing Grace Ministries MN. Order online and pick up at Sunday service — 715 Edgerton Street, Saint Paul.',
}

// Products live in Firestore — render per request, never prerender stale stock.
export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/** Firestore being unreachable must never take the page down. */
async function loadProducts(category?: string): Promise<{ products: Product[]; categories: string[] }> {
  try {
    const [products, categories] = await Promise.all([
      listActiveProducts(category ? { category } : undefined),
      listActiveCategories(),
    ])
    return { products, categories }
  } catch (error) {
    console.error('[shop] failed to load products', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return { products: [], categories: [] }
  }
}

export default async function ShopPage({ searchParams }: PageProps) {
  const query = await searchParams
  const category = typeof query.category === 'string' && query.category.length > 0 ? query.category : undefined
  const { products, categories } = await loadProducts(category)

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <section className="bg-surface-sunken">
        <div className="mx-auto w-full max-w-7xl px-6 pt-40 pb-16">
          <Reveal>
            <p className="eyebrow text-accent">Shop</p>
            <h1 className="mt-4 max-w-4xl font-display text-display-lg font-light tracking-display text-text-primary">
              Wear the message<span className="text-accent">.</span>
            </h1>
            <p className="mt-6 max-w-xl text-body text-text-secondary">
              Every order is picked up at Sunday service — 715 Edgerton Street, Saint Paul.
              No shipping, no tax.
            </p>
          </Reveal>
        </div>
      </section>

      <Section rhythm="normal">
        {categories.length > 1 && (
          <nav aria-label="Filter by category" className="mb-10 flex flex-wrap gap-2">
            <Link
              href="/shop"
              aria-current={!category ? 'page' : undefined}
              className={cn(
                'border px-4 py-2 text-body-sm font-semibold transition-colors duration-200',
                !category
                  ? 'border-accent bg-accent-subtle text-accent'
                  : 'border-border-strong text-text-secondary hover:border-accent hover:text-accent'
              )}
            >
              All
            </Link>
            {categories.map((name) => (
              <Link
                key={name}
                href={`/shop?category=${encodeURIComponent(name)}`}
                aria-current={category === name ? 'page' : undefined}
                className={cn(
                  'border px-4 py-2 text-body-sm font-semibold transition-colors duration-200',
                  category === name
                    ? 'border-accent bg-accent-subtle text-accent'
                    : 'border-border-strong text-text-secondary hover:border-accent hover:text-accent'
                )}
              >
                {name}
              </Link>
            ))}
          </nav>
        )}

        {products.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="size-6" aria-hidden />}
            title={category ? `Nothing in ${category} yet` : 'The shop is being stocked'}
            body="New merch is on the way. Check back soon — or ask at the merch table this Sunday."
          />
        ) : (
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </Section>
    </main>
  )
}
