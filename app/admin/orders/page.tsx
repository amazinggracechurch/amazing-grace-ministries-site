import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import OrderStatusActions from '@/components/admin/OrderStatusActions'
import Badge, { type BadgeVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { getOrderById, type OrderStatus } from '@/lib/shop'
import { formatUsd } from '@/lib/money'

export const metadata: Metadata = {
  title: 'Order Lookup | Admin | Amazing Grace Ministries MN',
}

export const dynamic = 'force-dynamic'

const STATUS_VARIANTS: Record<OrderStatus, BadgeVariant> = {
  paid: 'accent',
  ready: 'success',
  collected: 'neutral',
  refunded: 'warning',
  cancelled: 'danger',
}

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/**
 * Pickup QR scan target: /admin/orders?scan=<orderId>. The QR in the
 * confirmation email/page encodes this URL; staff scan it at the merch
 * table to pull the order up and mark it collected. Without a scan param
 * it hands off to the full orders list.
 */
export default async function AdminOrderScanPage({ searchParams }: PageProps) {
  const query = await searchParams
  const orderId = typeof query.scan === 'string' ? query.scan : null
  if (!orderId) redirect('/admin/shop/orders')

  const order = await getOrderById(orderId).catch(() => null)

  return (
    <div>
      <AdminHeader title="Order pickup" description="Scanned from a customer pickup QR code." />
      {!order ? (
        <div className="mt-10 border border-border-subtle bg-surface-raised p-8">
          <p className="font-display text-heading text-text-primary">Order not found</p>
          <p className="mt-2 text-body-sm text-text-secondary">
            This scan code doesn&apos;t match an order. Check the code and try again.
          </p>
          <div className="mt-6">
            <Button href="/admin/shop/orders" variant="secondary">
              All orders
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-10 max-w-2xl border border-border-subtle bg-surface-raised p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-text-muted">Order</p>
              <p className="mt-1 font-display text-display-md font-light tracking-display text-text-primary">
                {order.orderNumber}
              </p>
            </div>
            <Badge variant={STATUS_VARIANTS[order.status]}>{order.status}</Badge>
          </div>

          <dl className="mt-8 flex flex-col gap-4 border-y border-border-subtle py-6">
            <div>
              <dt className="eyebrow text-text-muted">Customer</dt>
              <dd className="mt-1 text-body-sm font-semibold text-text-primary">{order.email}</dd>
            </div>
            <div>
              <dt className="eyebrow text-text-muted">Items</dt>
              <dd className="mt-1 text-body-sm text-text-secondary">
                {order.items.map((item) => `${item.title} × ${item.qty}`).join('; ')}
              </dd>
            </div>
            <div>
              <dt className="eyebrow text-text-muted">Total</dt>
              <dd className="mt-1 text-body-sm font-semibold text-text-primary">
                {formatUsd(order.totalCents)}
              </dd>
            </div>
            <div>
              <dt className="eyebrow text-text-muted">Placed</dt>
              <dd className="mt-1 text-body-sm text-text-secondary">
                {new Date(order.createdAt).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </dd>
            </div>
          </dl>

          <div className="mt-8">
            {order.status === 'collected' ? (
              <p className="text-body text-text-secondary">
                Already collected
                {order.collectedAt
                  ? ` on ${new Date(order.collectedAt).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}`
                  : ''}
                .
              </p>
            ) : (
              <OrderStatusActions
                orderId={order.id}
                orderNumber={order.orderNumber}
                status={order.status}
              />
            )}
          </div>
          <div className="mt-6">
            <Button href="/admin/shop/orders" variant="ghost" size="sm">
              All orders
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
