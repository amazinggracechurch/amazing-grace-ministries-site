import type { Metadata } from 'next'
import { Package } from 'lucide-react'
import AdminHeader from '@/components/admin/AdminHeader'
import Badge, { type BadgeVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { listAllProducts, lowStockProducts, totalStock, type ProductStatus } from '@/lib/shop'
import { formatUsd } from '@/lib/money'

export const metadata: Metadata = {
  title: 'Shop | Admin | Amazing Grace Ministries MN',
}

export const dynamic = 'force-dynamic'

const STATUS_VARIANTS: Record<ProductStatus, BadgeVariant> = {
  draft: 'neutral',
  active: 'success',
  archived: 'warning',
}

export default async function AdminShopPage() {
  const [products, lowStock] = await Promise.all([listAllProducts(), lowStockProducts()])

  return (
    <div>
      <AdminHeader
        title="Shop"
        description="Merch sold online and picked up at Sunday service. Stock only moves through paid orders and edits here."
        action={
          <div className="flex gap-3">
            <Button href="/admin/shop/orders" variant="secondary">
              Orders
            </Button>
            <Button href="/admin/shop/new" variant="primary">
              New product
            </Button>
          </div>
        }
      />
      {lowStock.length > 0 && (
        <p className="mt-6 border border-border-subtle bg-surface-raised px-4 py-3 text-body-sm text-text-secondary">
          <Badge variant="warning">Low stock</Badge>{' '}
          {lowStock.map((product) => product.title).join(', ')}{' '}
          {lowStock.length === 1 ? 'has' : 'have'} 3 or fewer units left.
        </p>
      )}
      {products.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<Package className="size-6" aria-hidden />}
            title="No products yet"
            body="Create your first product to open the shop."
            action={
              <Button href="/admin/shop/new" variant="primary">
                New product
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border-strong text-caption uppercase tracking-eyebrow text-text-muted">
                <th scope="col" className="py-3 pr-4 font-semibold">Product</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Price</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Stock</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Status</th>
                <th scope="col" className="py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const stock = totalStock(product)
                return (
                  <tr key={product.id} className="border-b border-border-subtle align-middle">
                    <td className="py-4 pr-4">
                      <span className="text-body font-semibold text-text-primary">
                        {product.title}
                        {product.featured && (
                          <>
                            {' '}
                            <Badge variant="accent">Featured</Badge>
                          </>
                        )}
                      </span>
                      <span className="block text-caption text-text-muted">
                        /{product.slug} · {product.category} · {product.variants.length} variant
                        {product.variants.length === 1 ? '' : 's'}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-body-sm text-text-secondary">
                      {formatUsd(product.priceCents)}
                    </td>
                    <td className="py-4 pr-4 text-body-sm text-text-secondary">
                      {stock}
                      {stock === 0 && (
                        <>
                          {' '}
                          <Badge variant="danger">Sold out</Badge>
                        </>
                      )}
                      {stock > 0 && stock <= 3 && (
                        <>
                          {' '}
                          <Badge variant="warning">Low</Badge>
                        </>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      <Badge variant={STATUS_VARIANTS[product.status]}>{product.status}</Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button href={`/admin/shop/${product.id}/edit`} variant="secondary" size="sm">
                          Edit
                        </Button>
                        {product.status === 'active' && (
                          <Button href={`/shop/${product.slug}`} variant="ghost" size="sm">
                            View
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
