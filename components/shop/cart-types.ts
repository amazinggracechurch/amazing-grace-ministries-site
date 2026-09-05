/**
 * Shared cart types — client-safe (no server imports).
 *
 * A cart line is keyed by productId + variantId and snapshots display data
 * (title, image, price) at add time; prices and stock are ALWAYS
 * re-validated server-side at checkout, so a stale snapshot can never
 * change what the customer is charged.
 */
export const CART_STORAGE_KEY = 'agm-shop-cart'
export const CART_CHANGED_EVENT = 'agm-cart-changed'

export type CartItem = {
  productId: string
  variantId: string
  title: string
  variantName: string
  slug: string
  image: string | null
  priceCents: number
  qty: number
  /** Stock captured at add time; caps the quantity stepper. */
  maxStock: number
}

export type CartSnapshot = {
  items: CartItem[]
  /** ISO timestamp of the last local mutation — drives merge recency. */
  updatedAt: string
}

export function cartItemKey(item: Pick<CartItem, 'productId' | 'variantId'>): string {
  return `${item.productId}:${item.variantId}`
}

export function cartSubtotalCents(items: readonly CartItem[]): number {
  return items.reduce((sum, item) => sum + item.priceCents * item.qty, 0)
}

export function cartItemCount(items: readonly CartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0)
}

/**
 * Merge a local cart with the server-side carts/{uid} doc on sign-in.
 * Rule (keep it simple, documented): the cart with the NEWER updatedAt is
 * the base; lines that exist only in the older cart are appended; for
 * lines in both, the newer cart's quantity wins. Nothing is ever dropped.
 */
export function mergeCarts(local: CartSnapshot, server: CartSnapshot): CartSnapshot {
  const [newer, older] =
    local.updatedAt >= server.updatedAt ? [local, server] : [server, local]
  const merged = new Map(newer.items.map((item) => [cartItemKey(item), item]))
  for (const item of older.items) {
    const key = cartItemKey(item)
    if (!merged.has(key)) merged.set(key, item)
  }
  return { items: [...merged.values()], updatedAt: newer.updatedAt }
}
