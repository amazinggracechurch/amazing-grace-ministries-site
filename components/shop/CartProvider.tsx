'use client'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import {
  CART_CHANGED_EVENT,
  CART_STORAGE_KEY,
  cartItemKey,
  cartSubtotalCents,
  mergeCarts,
  type CartItem,
  type CartSnapshot,
} from './cart-types'

/**
 * Shop cart context (spec §8). Mounted by app/shop/layout.tsx so every
 * shop page shares cart state; the Navbar's CartNavButton is NOT inside
 * this provider — it mirrors the count from localStorage via the
 * 'agm-cart-changed' window event dispatched on every mutation.
 *
 * Persistence:
 * - Always: localStorage ('agm-shop-cart') as { items, updatedAt }.
 * - Signed-in members: ALSO synced to carts/{uid} via /api/shop/cart.
 *   On sign-in the server cart is fetched and merged with the local one
 *   (mergeCarts: newer cart wins per-line conflicts, nothing is dropped);
 *   the merged result is written back to both stores.
 */

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotalCents: number
  /** Signed-in member's email, for pre-filling checkout. */
  userEmail: string | null
  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  addItem: (item: CartItem) => void
  setQty: (key: string, qty: number) => void
  removeItem: (key: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function readLocalCart(): CartSnapshot {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return { items: [], updatedAt: new Date(0).toISOString() }
    const parsed = JSON.parse(raw) as Partial<CartSnapshot>
    return {
      items: Array.isArray(parsed.items) ? (parsed.items as CartItem[]) : [],
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date(0).toISOString(),
    }
  } catch {
    return { items: [], updatedAt: new Date(0).toISOString() }
  }
}

function writeLocalCart(snapshot: CartSnapshot): void {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // Private browsing — the cart still lives in memory for this session.
  }
  window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT))
}

function CartStateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  // Hydration guard: nothing persists until the local cart is loaded.
  const hydratedRef = useRef(false)
  const mergedForUidRef = useRef<string | null>(null)

  useEffect(() => {
    // Hydrate from localStorage after mount (it doesn't exist on the
    // server). Deferred so the lint-clean rule against synchronous
    // setState-in-effect is respected; the persist effect only starts
    // writing once this flag flips, so the saved cart can't be clobbered.
    const snapshot = readLocalCart()
    const id = window.setTimeout(() => {
      setItems(snapshot.items)
      hydratedRef.current = true
    }, 0)
    return () => window.clearTimeout(id)
  }, [])

  const snapshot = useCallback(
    (): CartSnapshot => ({ items, updatedAt: new Date().toISOString() }),
    [items]
  )

  // Persist every post-hydration change locally; mirror to the server cart
  // for signed-in members (fire-and-forget — localStorage is the fallback).
  useEffect(() => {
    if (!hydratedRef.current) return
    writeLocalCart(snapshot())
    if (user && mergedForUidRef.current === user.uid) {
      void fetch('/api/shop/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot()),
      }).catch(() => {})
    }
  }, [items, user, snapshot])

  // Sign-in merge: fetch carts/{uid} once per uid and reconcile.
  useEffect(() => {
    if (!user || mergedForUidRef.current === user.uid) return
    let cancelled = false
    void (async () => {
      try {
        const response = await fetch('/api/shop/cart')
        if (!response.ok) return
        const server = (await response.json()) as CartSnapshot
        if (cancelled) return
        const merged = mergeCarts(readLocalCart(), {
          items: Array.isArray(server.items) ? server.items : [],
          updatedAt: typeof server.updatedAt === 'string' ? server.updatedAt : new Date(0).toISOString(),
        })
        mergedForUidRef.current = user.uid
        setItems(merged.items)
        // Persist the merged cart back to the server copy.
        void fetch('/api/shop/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: merged.items, updatedAt: new Date().toISOString() }),
        }).catch(() => {})
      } catch {
        // Offline/server down — the local cart remains authoritative.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  const addItem = useCallback((incoming: CartItem) => {
    setItems((current) => {
      const key = cartItemKey(incoming)
      const existing = current.find((item) => cartItemKey(item) === key)
      if (!existing) return [...current, incoming]
      return current.map((item) =>
        cartItemKey(item) === key
          ? { ...item, qty: Math.min(item.qty + incoming.qty, item.maxStock), maxStock: incoming.maxStock }
          : item
      )
    })
    setDrawerOpen(true)
  }, [])

  const setQty = useCallback((key: string, qty: number) => {
    setItems((current) =>
      qty <= 0
        ? current.filter((item) => cartItemKey(item) !== key)
        : current.map((item) =>
            cartItemKey(item) === key
              ? { ...item, qty: Math.min(Math.max(1, qty), item.maxStock) }
              : item
          )
    )
  }, [])

  const removeItem = useCallback((key: string) => {
    setItems((current) => current.filter((item) => cartItemKey(item) !== key))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])
  const openDrawer = useCallback(() => setDrawerOpen(true), [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: items.reduce((sum, item) => sum + item.qty, 0),
      subtotalCents: cartSubtotalCents(items),
      userEmail: user?.email ?? null,
      drawerOpen,
      openDrawer,
      closeDrawer,
      addItem,
      setQty,
      removeItem,
      clearCart,
    }),
    [items, user, drawerOpen, openDrawer, closeDrawer, addItem, setQty, removeItem, clearCart]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function CartProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartStateProvider>{children}</CartStateProvider>
    </AuthProvider>
  )
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside <CartProvider>')
  return context
}
