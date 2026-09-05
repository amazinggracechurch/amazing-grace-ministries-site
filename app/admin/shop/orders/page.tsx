import type { Metadata } from 'next'
import Link from 'next/link'
import { PackageOpen } from 'lucide-react'
import AdminHeader from '@/components/admin/AdminHeader'
import OrderStatusActions from '@/components/admin/OrderStatusActions'
import Badge, { type BadgeVariant } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { listOrders, type OrderStatus } from '@/lib/shop'
import { formatUsd } from '@/lib/money'
import { cn } from '@/lib/cn'

export const metadata: Metadata = {
  title: 'Shop Orders | Admin | Amazing Grace Ministries MN',
}

export const dynamic = 'force-dynamic'

const STATUS_VARIANTS: Record<OrderStatus, BadgeVariant> = {
  paid: 'accent',
  ready: 'success',
  collected: 'neutral',
  refunded: 'warning',
  cancelled: 'danger',
}

const FILTERS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'ready', label: 'Ready' },
  { value: 'collected', label: 'Collected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const query = await searchParams
  const filter =
    typeof query.status === 'string' && FILTERS.some((f) => f.value === query.status)
      ? (query.status as OrderStatus | 'all')
      : 'all'
  const orders = await listOrders(filter === 'all' ? undefined : { status: filter })

  return (
    <div>
      <AdminHeader
        title="Shop orders"
        description="Paid orders move paid → ready → collected as items are set aside and picked up. Scan a pickup QR to jump straight to an order."
      />

      <nav aria-label="Filter by status" className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <Link
            key={option.value}
            href={option.value === 'all' ? '/admin/shop/orders' : `/admin/shop/orders?status=${option.value}`}
            aria-current={filter === option.value ? 'page' : undefined}
            className={cn(
              'border px-4 py-2 text-body-sm font-semibold transition-colors duration-200',
              filter === option.value
                ? 'border-accent bg-accent-subtle text-accent'
                : 'border-border-strong text-text-secondary hover:border-accent hover:text-accent'
            )}
          >
            {option.label}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<PackageOpen className="size-6" aria-hidden />}
            title="No orders"
            body={filter === 'all' ? 'Orders will appear here after the first purchase.' : `No ${filter} orders.`}
          />
        </div>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border-strong text-caption uppercase tracking-eyebrow text-text-muted">
                <th scope="col" className="py-3 pr-4 font-semibold">Order</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Customer</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Items</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Total</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Status</th>
                <th scope="col" className="py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border-subtle align-middle">
                  <td className="py-4 pr-4">
                    <Link
                      href={`/admin/orders?scan=${encodeURIComponent(order.id)}`}
                      className="text-body font-semibold text-text-primary transition-colors duration-200 hover:text-accent"
                    >
                      {order.orderNumber}
                    </Link>
                    <span className="block text-caption text-text-muted">
                      {new Date(order.createdAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-body-sm text-text-secondary">{order.email}</td>
                  <td className="py-4 pr-4 text-body-sm text-text-secondary">
                    {order.items.map((item) => `${item.title} × ${item.qty}`).join('; ')}
                  </td>
                  <td className="py-4 pr-4 text-body-sm font-semibold text-text-primary">
                    {formatUsd(order.totalCents)}
                  </td>
                  <td className="py-4 pr-4">
                    <Badge variant={STATUS_VARIANTS[order.status]}>{order.status}</Badge>
                  </td>
                  <td className="py-4">
                    <OrderStatusActions
                      orderId={order.id}
                      orderNumber={order.orderNumber}
                      status={order.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
