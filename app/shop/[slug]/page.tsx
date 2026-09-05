import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Section from '@/components/layout/Section'
import Reveal from '@/components/ui/Reveal'
import ProductGallery from '@/components/shop/ProductGallery'
import ProductPurchase from '@/components/shop/ProductPurchase'
import { getProductBySlug, totalStock, type Product } from '@/lib/shop'
import { site } from '@/lib/site'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ slug: string }>
}

async function loadProduct(slug: string): Promise<Product | null> {
  try {
    return await getProductBySlug(slug)
  } catch (error) {
    console.error('[shop] failed to load product', {
      slug,
      message: error instanceof Error ? error.message : 'unknown',
    })
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await loadProduct(slug)
  if (!product) {
    return { title: 'Product Not Found | Amazing Grace Ministries MN' }
  }
  const description =
    product.description.length > 160
      ? `${product.description.slice(0, 157)}…`
      : product.description || `${product.title} — merch from Amazing Grace Ministries MN.`
  return {
    title: `${product.title} | Shop | Amazing Grace Ministries MN`,
    description,
    openGraph: {
      title: product.title,
      description,
      type: 'website',
      ...(product.images[0] ? { images: [{ url: product.images[0] }] } : {}),
    },
  }
}

function productJsonLd(product: Product) {
  const inStock = totalStock(product) > 0
  const base = env.siteUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    ...(product.images.length > 0 ? { image: product.images } : {}),
    brand: { '@type': 'Organization', name: site.shortName },
    offers: {
      '@type': 'Offer',
      url: `${base}/shop/${product.slug}`,
      price: (product.priceCents / 100).toFixed(2),
      priceCurrency: 'USD',
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const product = await loadProduct(slug)
  if (!product) notFound()

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd(product)).replace(/</g, '\\u003c'),
        }}
      />
      <Section rhythm="normal" className="pt-40">
        <div className="grid gap-12 lg:grid-cols-2">
          <Reveal>
            {product.images.length > 0 ? (
              <ProductGallery images={product.images} title={product.title} />
            ) : (
              <div className="flex aspect-[4/5] flex-col items-center justify-center gap-4 border border-border-subtle bg-surface-sunken p-10 text-center">
                <span className="font-display text-display-lg font-light tracking-display text-text-muted">
                  {product.title.charAt(0)}
                </span>
                <span className="eyebrow text-text-muted">{product.category}</span>
              </div>
            )}
          </Reveal>

          <Reveal delay={1}>
            <p className="eyebrow text-accent">{product.category}</p>
            <h1 className="mt-3 font-display text-display-md font-light tracking-display text-text-primary">
              {product.title}
            </h1>
            <div className="mt-6">
              <ProductPurchase product={product} />
            </div>
            {product.description && (
              <div className="mt-10 border-t border-border-subtle pt-8">
                <p className="text-body leading-relaxed text-text-secondary">
                  {product.description}
                </p>
              </div>
            )}
          </Reveal>
        </div>
      </Section>
    </main>
  )
}
