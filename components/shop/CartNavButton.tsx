'use client'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CART_CHANGED_EVENT, CART_STORAGE_KEY, cartItemCount, type CartItem, type CartSnapshot } from './cart-types'

function readCount(): number {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return 0
    const parsed = JSON.parse(raw) as Partial<CartSnapshot>
    return Array.isArray(parsed.items) ? cartItemCount(parsed.items as CartItem[]) : 0
  } catch {
    return 0
  }
}

/**
 * Navbar cart icon with a count badge. The Navbar renders on every page —
 * outside the shop's CartProvider — so this mirrors the count straight
 * from localStorage and refreshes on the 'agm-cart-changed' event the
 * provider dispatches on every mutation (plus cross-tab storage events).
 */
export default function CartNavButton() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const refresh = () => setCount(readCount())
    refresh()
    window.addEventListener(CART_CHANGED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return (
    <Link
      href="/shop/cart"
      aria-label={count > 0 ? `Cart, ${count} item${count === 1 ? '' : 's'}` : 'Cart'}
      className="relative text-text-secondary transition-colors duration-200 hover:text-accent"
    >
      <ShoppingBag className="size-5" aria-hidden />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -top-2 -right-2 flex size-4 items-center justify-center bg-accent text-on-accent text-caption font-semibold leading-none"
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
