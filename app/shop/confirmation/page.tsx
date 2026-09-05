import type { Metadata } from 'next'
import Image from 'next/image'
import QRCode from 'qrcode'
import { CheckCircle2 } from 'lucide-react'
import Section from '@/components/layout/Section'
import Button from '@/components/ui/Button'
import ClearCartOnMount from '@/components/shop/ClearCartOnMount'
import { getOrderByStripeSessionId, orderScanUrl, PICKUP_NOTES, type Order } from '@/lib/shop'
import { getSessionUser } from '@/lib/auth/session'
import { formatUsd } from '@/lib/money'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Order Confirmed | Amazing Grace Ministries MN',
}

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/** Pickup QR as a data URI — encodes the admin scan URL for this order. */
async function qrDataUri(order: Order): Promise<string> {
  return QRCode.toDataURL(orderScanUrl(order.id), {
    errorCorrectionLevel: 'M',
    width: 320,
    margin: 2,
  })
}

export default async function ConfirmationPage({ searchParams }: PageProps) {
  const query = await searchParams
  const sessionId = typeof query.session_id === 'string' ? query.session_id : null

  const order = sessionId
    ? await getOrderByStripeSessionId(sessionId).catch((error) => {
        console.error('[shop confirmation] order lookup failed', {
          message: error instanceof Error ? error.message : 'unknown',
        })
        return null
      })
    : null
  const user = await getSessionUser()
  const qr = order ? await qrDataUri(order) : null

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      {/* Payment completed — the cart is spent whether or not the webhook has landed. */}
      <ClearCartOnMount />
      <Section rhythm="loose" className="pt-40">
        <div className="mx-auto max-w-2xl">
          {!order ? (
            <div>
              <p className="eyebrow text-accent">Shop</p>
              <h1 className="mt-4 font-display text-display-md font-light tracking-display text-text-primary">
                Confirming your order<span className="text-accent">.</span>
              </h1>
              <p className="mt-6 text-body text-text-secondary">
                Your payment was received and we&apos;re preparing your confirmation. This can
                take a few seconds — a receipt and pickup QR code are on their way to your
                email. If nothing arrives within a few minutes, contact us at{' '}
                {site.contact.email}.
              </p>
              <div className="mt-8">
                <Button href="/shop" variant="secondary">
                  Back to the shop
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex size-12 items-center justify-center bg-accent-subtle text-accent">
                <CheckCircle2 className="size-6" aria-hidden />
              </div>
              <p className="mt-6 eyebrow text-accent">Order {order.orderNumber}</p>
              <h1 className="mt-4 font-display text-display-md font-light tracking-display text-text-primary">
                Thank you — see you Sunday<span className="text-accent">.</span>
              </h1>
              <p className="mt-6 text-body text-text-secondary">{order.pickupNotes || PICKUP_NOTES}</p>

              <ul className="mt-10 flex flex-col divide-y divide-border-subtle border-y border-border-subtle">
                {order.items.map((item) => (
                  <li
                    key={`${item.productId}:${item.variantId}`}
                    className="flex items-baseline justify-between gap-4 py-4"
                  >
                    <span className="text-body text-text-primary">
                      {item.title} <span className="text-text-muted">× {item.qty}</span>
                    </span>
                    <span className="text-body-sm text-text-secondary">
                      {formatUsd(item.priceCents * item.qty)}
                    </span>
                  </li>
                ))}
                <li className="flex items-baseline justify-between gap-4 py-4">
                  <span className="text-body font-semibold text-text-primary">Total</span>
                  <span className="font-display text-heading text-text-primary">
                    {formatUsd(order.totalCents)}
                  </span>
                </li>
              </ul>

              {qr && (
                <div className="mt-10 border border-border-subtle bg-surface-raised p-8 text-center">
                  <p className="eyebrow text-text-muted">Your pickup pass</p>
                  <Image
                    src={qr}
                    alt={`Pickup QR code for order ${order.orderNumber}`}
                    width={200}
                    height={200}
                    unoptimized
                    className="mx-auto mt-4"
                  />
                  <p className="mt-4 text-body-sm text-text-secondary">
                    Show this at the merch table on Sunday — a team member will scan it and
                    hand you your order. It&apos;s also attached to your confirmation email.
                  </p>
                </div>
              )}

              <div className="mt-10 flex flex-wrap gap-4">
                {user && (
                  <Button href="/account/orders" variant="primary">
                    View in your account
                  </Button>
                )}
                <Button href="/shop" variant="secondary">
                  Back to the shop
                </Button>
              </div>
            </div>
          )}
        </div>
      </Section>
    </main>
  )
}
