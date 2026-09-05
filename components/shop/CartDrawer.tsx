'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Drawer from '@/components/ui/Drawer'
import { formatUsd } from '@/lib/money'
import { cartItemKey } from './cart-types'
import { useCart } from './CartProvider'

/**
 * Slide-out cart (uses the Drawer primitive). Quantity changes respect the
 * stock captured at add time; checkout re-validates against live stock.
 */
export default function CartDrawer() {
  const { items, subtotalCents, drawerOpen, closeDrawer, setQty, removeItem } = useCart()

  return (
    <Drawer open={drawerOpen} onClose={closeDrawer} title="Your Cart">
      {items.length === 0 ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-body text-text-secondary">Your cart is empty.</p>
          <Button href="/shop" variant="secondary" onClick={closeDrawer}>
            Browse the shop
          </Button>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <ul className="flex flex-col gap-6">
            {items.map((item) => {
              const key = cartItemKey(item)
              return (
                <li key={key} className="flex gap-4">
                  <div className="relative size-20 shrink-0 overflow-hidden bg-surface-sunken">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="80px"
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
                    <Link
                      href={`/shop/${item.slug}`}
                      onClick={closeDrawer}
                      className="text-body-sm font-semibold text-text-primary transition-colors duration-200 hover:text-accent"
                    >
                      {item.title}
                    </Link>
                    <p className="text-caption text-text-muted">{item.variantName}</p>
                    <p className="mt-1 text-body-sm text-text-secondary">
                      {formatUsd(item.priceCents)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.title}`}
                        onClick={() => setQty(key, item.qty - 1)}
                        className="flex size-7 items-center justify-center border border-border-subtle text-text-secondary transition-colors duration-200 hover:border-accent hover:text-accent"
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
                        className="flex size-7 items-center justify-center border border-border-subtle text-text-secondary transition-colors duration-200 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus className="size-3" aria-hidden />
                      </button>
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

          <div className="mt-8 border-t border-border-subtle pt-6">
            <div className="flex items-baseline justify-between">
              <span className="text-body font-semibold text-text-primary">Subtotal</span>
              <span className="font-display text-heading text-text-primary">
                {formatUsd(subtotalCents)}
              </span>
            </div>
            <p className="mt-2 text-caption text-text-muted">
              Pickup at Sunday service — 715 Edgerton Street, Saint Paul. No shipping, no tax.
            </p>
            <div className="mt-6">
              <Button href="/shop/cart" variant="primary" className="w-full" onClick={closeDrawer}>
                Review &amp; Checkout
              </Button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  )
}
