'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import { formatUsd } from '@/lib/money'
import { cartItemKey } from '@/components/shop/cart-types'
import { useCart } from '@/components/shop/CartProvider'

/**
 * Cart review + checkout start. Posts the cart to /api/shop/checkout,
 * which validates stock server-side and returns the Stripe Checkout URL.
 * The email is pre-filled for signed-in members; Stripe emails the
 * receipt and the church emails the pickup QR to this address.
 */
export default function CartPage() {
  const { items, subtotalCents, userEmail, setQty, removeItem, clearCart } = useCart()
  // null until the member edits the field — until then the signed-in
  // account email is the pre-filled value.
  const [emailOverride, setEmailOverride] = useState<string | null>(null)
  const email = emailOverride ?? userEmail ?? ''
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ firstName?: string; lastName?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleCheckout() {
    setError(null)
    const nextFieldErrors: { firstName?: string; lastName?: string } = {}
    if (!firstName.trim()) nextFieldErrors.firstName = 'Please enter your first name.'
    if (!lastName.trim()) nextFieldErrors.lastName = 'Please enter your last name.'
    setFieldErrors(nextFieldErrors)
    if (nextFieldErrors.firstName || nextFieldErrors.lastName) return
    setSubmitting(true)
    try {
      const response = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email: email.trim() || undefined,
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            qty: item.qty,
          })),
        }),
      })
      const data = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || !data.url) {
        setError(data.error ?? 'Could not start checkout. Please try again.')
        return
      }
      window.location.href = data.url
    } catch {
      setError('Could not start checkout. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <section className="flex-1 pt-40 pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <p className="eyebrow text-text-muted">Shop</p>
          <h1 className="mt-4 font-display text-display-md font-light uppercase tracking-display text-text-primary">
            Your cart<span className="text-accent">.</span>
          </h1>

          {items.length === 0 ? (
            <div className="mt-14 flex flex-col items-start gap-4">
              <p className="text-body text-text-secondary">Your cart is empty.</p>
              <Button href="/shop" variant="primary">
                Browse the shop
              </Button>
            </div>
          ) : (
            <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_22rem]">
              <ul className="flex flex-col divide-y divide-border-subtle border-y border-border-subtle">
                {items.map((item) => {
                  const key = cartItemKey(item)
                  return (
                    <li key={key} className="flex gap-6 py-6">
                      <div className="relative size-24 shrink-0 overflow-hidden bg-surface-sunken">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt=""
                            fill
                            sizes="96px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center font-display text-heading text-text-muted">
                            {item.title.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <Link
                              href={`/shop/${item.slug}`}
                              className="font-display text-heading tracking-display text-text-primary transition-colors duration-200 hover:text-accent"
                            >
                              {item.title}
                            </Link>
                            <p className="mt-1 text-caption text-text-muted">{item.variantName}</p>
                          </div>
                          <p className="text-body font-semibold text-text-primary">
                            {formatUsd(item.priceCents * item.qty)}
                          </p>
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${item.title}`}
                            onClick={() => setQty(key, item.qty - 1)}
                            className="flex size-8 items-center justify-center border border-border-subtle text-text-secondary transition-colors duration-200 hover:border-accent hover:text-accent"
                          >
                            <Minus className="size-3" aria-hidden />
                          </button>
                          <span className="min-w-6 text-center text-body-sm text-text-primary">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase quantity of ${item.title}`}
                            disabled={item.qty >= item.maxStock}
                            onClick={() => setQty(key, item.qty + 1)}
                            className="flex size-8 items-center justify-center border border-border-subtle text-text-secondary transition-colors duration-200 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus className="size-3" aria-hidden />
                          </button>
                          {item.qty >= item.maxStock && (
                            <span className="text-caption text-warning">
                              Only {item.maxStock} in stock
                            </span>
                          )}
                          <button
                            type="button"
                            aria-label={`Remove ${item.title} from cart`}
                            onClick={() => removeItem(key)}
                            className="ml-auto p-1 text-text-muted transition-colors duration-200 hover:text-danger"
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>

              <aside className="h-fit border border-border-subtle bg-surface-raised p-8">
                <div className="flex size-12 items-center justify-center bg-accent-subtle text-accent">
                  <ShoppingBag className="size-6" aria-hidden />
                </div>
                <h2 className="mt-4 font-display text-heading text-text-primary">Order summary</h2>
                <div className="mt-6 flex items-baseline justify-between border-t border-border-subtle pt-4">
                  <span className="text-body text-text-secondary">Subtotal</span>
                  <span className="text-body font-semibold text-text-primary">
                    {formatUsd(subtotalCents)}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-body text-text-secondary">Tax</span>
                  <span className="text-body-sm text-text-muted">$0.00 — tax-exempt</span>
                </div>
                <div className="mt-4 flex items-baseline justify-between border-t border-border-subtle pt-4">
                  <span className="text-body font-semibold text-text-primary">Total</span>
                  <span className="font-display text-heading text-text-primary">
                    {formatUsd(subtotalCents)}
                  </span>
                </div>
                <p className="mt-4 text-caption text-text-muted">
                  Pickup at Sunday service — 715 Edgerton Street, Saint Paul. You&apos;ll get a
                  pickup QR code by email after payment.
                </p>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="First name"
                    name="firstName"
                    autoComplete="given-name"
                    required
                    maxLength={60}
                    value={firstName}
                    error={fieldErrors.firstName}
                    onChange={(event) => {
                      setFirstName(event.target.value)
                      setFieldErrors((errors) => ({ ...errors, firstName: undefined }))
                    }}
                  />
                  <Input
                    label="Last name"
                    name="lastName"
                    autoComplete="family-name"
                    required
                    maxLength={60}
                    value={lastName}
                    error={fieldErrors.lastName}
                    onChange={(event) => {
                      setLastName(event.target.value)
                      setFieldErrors((errors) => ({ ...errors, lastName: undefined }))
                    }}
                  />
                </div>
                <div className="mt-4">
                  <Input
                    label="Email for your receipt"
                    type="email"
                    required
                    value={email}
                    hint="Your receipt and pickup QR code go here."
                    onChange={(event) => setEmailOverride(event.target.value)}
                  />
                </div>
                {error && (
                  <p role="alert" className="mt-4 text-body-sm text-danger">
                    {error}
                  </p>
                )}
                <div className="mt-6 flex flex-col gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={submitting || email.trim() === '' || firstName.trim() === '' || lastName.trim() === ''}
                    onClick={handleCheckout}
                    className="w-full"
                  >
                    {submitting ? <Spinner size="sm" /> : null}
                    {submitting ? 'Starting checkout…' : 'Checkout'}
                  </Button>
                  <Button variant="ghost" onClick={clearCart} className="w-full">
                    Clear cart
                  </Button>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
