import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Package } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Badge, { type BadgeVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { getSessionUser } from '@/lib/auth/session'
import { getOrdersForUser, type Order, type OrderStatus } from '@/lib/shop'
import { formatUsd } from '@/lib/money'

export const metadata: Metadata = {
  title: 'My Orders | Amazing Grace Ministries MN',
  description: 'Shop orders you have placed, with pickup status.',
}

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<OrderStatus, string> = {
  paid: 'Paid — preparing',
  ready: 'Ready for pickup',
  collected: 'Collected',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
}

const STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  paid: 'accent',
  ready: 'success',
  collected: 'neutral',
  refunded: 'warning',
  cancelled: 'danger',
}

function OrderCard({ order }: { order: Order }) {
  return (
    <article className="flex flex-col gap-4 border border-border-subtle bg-surface-raised p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant={STATUS_VARIANT[order.status]}>{STATUS_LABEL[order.status]}</Badge>
          <h3 className="mt-3 font-display text-heading font-medium tracking-display text-text-primary">
            {order.orderNumber}
          </h3>
          <p className="mt-1 text-caption text-text-muted">
            Placed {new Date(order.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })}
          </p>
        </div>
        <p className="text-body font-semibold text-text-primary">{formatUsd(order.totalCents)}</p>
      </div>

      <ul className="flex flex-col gap-1 text-body-sm text-text-secondary">
        {order.items.map((item) => (
          <li key={`${item.productId}:${item.variantId}`}>
            {item.title} × {item.qty}
          </li>
        ))}
      </ul>

      {(order.status === 'paid' || order.status === 'ready') && (
        <p className="text-body-sm text-text-muted">{order.pickupNotes}</p>
      )}
      {order.status === 'collected' && order.collectedAt && (
        <p className="text-body-sm text-text-muted">
          Collected {new Date(order.collectedAt).toLocaleDateString('en-US', { dateStyle: 'long' })}
        </p>
      )}
    </article>
  )
}

export default async function OrdersPage() {
  // The (protected) layout already enforced this; re-check so the page
  // never renders unauthenticated even if reused elsewhere.
  const user = await getSessionUser()
  if (!user) redirect('/account/signin?next=/account/orders')

  let orders: Order[] = []
  try {
    orders = await getOrdersForUser(user.uid, user.email)
  } catch (error) {
    console.error('[account] orders failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
  }

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <section className="flex-1 pt-32 pb-24 md:pt-40">
        <div className="mx-auto max-w-7xl px-6">
          <p className="eyebrow text-text-muted">Member Portal</p>
          <h1 className="mt-4 font-display text-display-md font-light uppercase tracking-display text-text-primary">
            My Orders
            <span className="text-accent">.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-body text-text-secondary">
            Merch you&apos;ve ordered — including orders placed with this email before you
            signed in. Pick everything up at Sunday service.
          </p>

          <div className="mt-14">
            {orders.length === 0 ? (
              <EmptyState
                icon={<Package className="size-6" aria-hidden />}
                title="No orders yet"
                body="When you order from the shop, your order number and pickup status will show up here."
                action={<Button href="/shop">Browse the shop</Button>}
              />
            ) : (
              <div className="flex flex-col gap-6">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
