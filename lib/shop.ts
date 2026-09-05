import 'server-only'
import type Stripe from 'stripe'
import { adminDb } from '@/lib/firebase/admin'
import { recordAudit } from '@/lib/audit'
import { env } from '@/lib/env'

/**
 * Firestore data layer for the merch shop (spec §8). Server-only.
 *
 * Fulfillment model: the church holds inventory and customers pick up at
 * services — there is deliberately NO shipping logic. `fulfillmentMethod`
 * is stored per product so a later shipping option doesn't require a
 * migration. `taxCents` is 0 on every order: pickup sales are handled as
 * tax-exempt by the church; if that ever changes, the field already exists.
 *
 * Query-shape note (repo convention): single-field `where` filters only,
 * merged and sorted in memory — no composite indexes required.
 */

export type ProductVariant = {
  id: string
  name: string
  sku: string
  stock: number
  /** Per-variant price override; falls back to the product price. */
  priceCents?: number
}

export type ProductStatus = 'active' | 'draft' | 'archived'

export type Product = {
  id: string
  title: string
  slug: string
  description: string
  images: string[]
  priceCents: number
  category: string
  variants: ProductVariant[]
  /** Always 'pickup' today; stored for a future shipping option. */
  fulfillmentMethod: 'pickup'
  status: ProductStatus
  featured: boolean
  createdAt: string
}

export type OrderItem = {
  productId: string
  variantId: string
  title: string
  qty: number
  priceCents: number
}

export type OrderStatus = 'paid' | 'ready' | 'collected' | 'refunded' | 'cancelled'

export type Order = {
  id: string
  /** Human-readable reference derived from the doc id: 'AGM-' + first 8. */
  orderNumber: string
  userId: string | null
  email: string
  items: OrderItem[]
  subtotalCents: number
  taxCents: number
  totalCents: number
  stripeSessionId: string
  status: OrderStatus
  pickupNotes: string
  createdAt: string
  collectedAt: string | null
}

/** Cart snapshot stashed before Stripe Checkout; consumed by the webhook. */
export type PendingOrder = {
  id: string
  email: string
  userId: string | null
  items: OrderItem[]
  subtotalCents: number
  taxCents: number
  totalCents: number
  stripeSessionId: string | null
  consumed: boolean
  createdAt: string
}

export class OrderStockError extends Error {
  constructor(
    message: string,
    readonly detail: { productId: string; variantId: string; requested: number; available: number }
  ) {
    super(message)
    this.name = 'OrderStockError'
  }
}

export const PICKUP_NOTES = 'Pickup at Sunday service — 715 Edgerton Street, Saint Paul, MN 55130'

/** 'AGM-' + first 8 chars of the doc id, uppercase. Simple and human-readable. */
export function orderNumber(orderId: string): string {
  return `AGM-${orderId.slice(0, 8).toUpperCase()}`
}

/** Admin scan URL encoded by the pickup QR code. */
export function orderScanUrl(orderId: string): string {
  return `${env.siteUrl()}/admin/orders?scan=${encodeURIComponent(orderId)}`
}

// --- defensive mapping (Firestore data is untyped; never trust it blindly) ---

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function asCents(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null
}

function asStock(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0
}

function toVariant(data: unknown, index: number): ProductVariant | null {
  if (typeof data !== 'object' || data === null) return null
  const record = data as Record<string, unknown>
  const name = asString(record.name)
  if (!name) return null
  const priceCents = asCents(record.priceCents)
  return {
    id: asString(record.id) ?? `variant-${index}`,
    name,
    sku: asString(record.sku) ?? '',
    stock: asStock(record.stock),
    ...(priceCents !== null ? { priceCents } : {}),
  }
}

function toProduct(id: string, data: Record<string, unknown>): Product {
  const status = asString(data.status)
  return {
    id,
    title: asString(data.title) ?? 'Untitled product',
    slug: asString(data.slug) ?? id,
    description: asString(data.description) ?? '',
    images: Array.isArray(data.images)
      ? data.images.filter((image): image is string => typeof image === 'string' && image.length > 0)
      : [],
    priceCents: asCents(data.priceCents) ?? 0,
    category: asString(data.category) ?? 'General',
    variants: Array.isArray(data.variants)
      ? data.variants
          .map((variant, index) => toVariant(variant, index))
          .filter((variant): variant is ProductVariant => variant !== null)
      : [],
    fulfillmentMethod: 'pickup',
    status: status === 'draft' || status === 'archived' ? status : 'active',
    featured: data.featured === true,
    createdAt: asString(data.createdAt) ?? new Date(0).toISOString(),
  }
}

function toOrderItem(data: unknown): OrderItem | null {
  if (typeof data !== 'object' || data === null) return null
  const record = data as Record<string, unknown>
  const productId = asString(record.productId)
  const variantId = asString(record.variantId)
  const title = asString(record.title)
  const qty = typeof record.qty === 'number' && Number.isInteger(record.qty) ? record.qty : 0
  const priceCents = asCents(record.priceCents)
  if (!productId || !variantId || !title || qty < 1 || priceCents === null) return null
  return { productId, variantId, title, qty, priceCents }
}

function toOrder(id: string, data: Record<string, unknown>): Order {
  const status = asString(data.status)
  return {
    id,
    orderNumber: orderNumber(id),
    userId: asString(data.userId),
    email: asString(data.email) ?? '',
    items: Array.isArray(data.items)
      ? data.items
          .map(toOrderItem)
          .filter((item): item is OrderItem => item !== null)
      : [],
    subtotalCents: asCents(data.subtotalCents) ?? 0,
    taxCents: asCents(data.taxCents) ?? 0,
    totalCents: asCents(data.totalCents) ?? 0,
    stripeSessionId: asString(data.stripeSessionId) ?? '',
    status:
      status === 'ready' || status === 'collected' || status === 'refunded' || status === 'cancelled'
        ? status
        : 'paid',
    pickupNotes: asString(data.pickupNotes) ?? PICKUP_NOTES,
    createdAt: asString(data.createdAt) ?? new Date(0).toISOString(),
    collectedAt: asString(data.collectedAt),
  }
}

// --- product reads ---

/** Active products, optionally filtered by category. Featured first, then newest. */
export async function listActiveProducts(options?: { category?: string }): Promise<Product[]> {
  const snapshot = await adminDb().collection('products').where('status', '==', 'active').get()
  return snapshot.docs
    .map((doc) => toProduct(doc.id, doc.data()))
    .filter((product) => !options?.category || product.category === options.category)
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.createdAt.localeCompare(a.createdAt))
}

/** Distinct categories across active products, alphabetical. */
export async function listActiveCategories(): Promise<string[]> {
  const products = await listActiveProducts()
  return [...new Set(products.map((product) => product.category))].sort((a, b) =>
    a.localeCompare(b)
  )
}

/** Active product by slug (public PDP), null when missing or not active. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const snapshot = await adminDb()
    .collection('products')
    .where('slug', '==', slug)
    .limit(1)
    .get()
  if (snapshot.empty) return null
  const product = toProduct(snapshot.docs[0]!.id, snapshot.docs[0]!.data())
  return product.status === 'active' ? product : null
}

/** Product by id regardless of status (admin + checkout validation). */
export async function getProductById(id: string): Promise<Product | null> {
  const snapshot = await adminDb().collection('products').doc(id).get()
  return snapshot.exists ? toProduct(snapshot.id, snapshot.data()!) : null
}

/** Every product regardless of status, newest first (admin list). */
export async function listAllProducts(): Promise<Product[]> {
  const snapshot = await adminDb().collection('products').get()
  return snapshot.docs
    .map((doc) => toProduct(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Total stock across a product's variants. */
export function totalStock(product: Product): number {
  return product.variants.reduce((sum, variant) => sum + variant.stock, 0)
}

/** Active products whose total stock is at or below the threshold. */
export async function lowStockProducts(threshold = 3): Promise<Product[]> {
  const products = await listActiveProducts()
  return products.filter((product) => totalStock(product) <= threshold)
}

// --- orders ---

export async function getOrderById(id: string): Promise<Order | null> {
  const snapshot = await adminDb().collection('orders').doc(id).get()
  return snapshot.exists ? toOrder(snapshot.id, snapshot.data()!) : null
}

/** Order paid through a given Stripe Checkout Session (confirmation page). */
export async function getOrderByStripeSessionId(sessionId: string): Promise<Order | null> {
  const snapshot = await adminDb()
    .collection('orders')
    .where('stripeSessionId', '==', sessionId)
    .limit(1)
    .get()
  return snapshot.empty ? null : toOrder(snapshot.docs[0]!.id, snapshot.docs[0]!.data())
}

/** Every order owned by this member (uid match OR email match — same rule as donations). */
export async function getOrdersForUser(uid: string, email: string | null): Promise<Order[]> {
  const db = adminDb()
  const byUid = await db.collection('orders').where('userId', '==', uid).get()
  const byEmail = email ? await db.collection('orders').where('email', '==', email).get() : null

  const merged = new Map<string, Order>()
  for (const doc of [...byUid.docs, ...(byEmail?.docs ?? [])]) {
    merged.set(doc.id, toOrder(doc.id, doc.data()))
  }
  return [...merged.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Admin order list, newest first, optionally filtered by status. */
export async function listOrders(options?: { status?: OrderStatus }): Promise<Order[]> {
  const snapshot = await adminDb().collection('orders').get()
  return snapshot.docs
    .map((doc) => toOrder(doc.id, doc.data()))
    .filter((order) => !options?.status || order.status === options.status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Forward-only pickup lifecycle; refunds/cancellations end the order. */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  paid: ['ready', 'collected', 'cancelled', 'refunded'],
  ready: ['collected', 'cancelled', 'refunded'],
  collected: ['refunded'],
  cancelled: [],
  refunded: [],
}

/**
 * Move an order along paid → ready → collected (or to cancelled/refunded).
 * Audited. Sets collectedAt when an order is collected. Returns null when
 * the order doesn't exist; throws on an illegal transition.
 */
export async function setOrderStatus(
  orderId: string,
  status: OrderStatus,
  actor: { uid: string; email: string | null }
): Promise<Order | null> {
  const db = adminDb()
  const ref = db.collection('orders').doc(orderId)
  const snapshot = await ref.get()
  if (!snapshot.exists) return null
  const before = toOrder(snapshot.id, snapshot.data()!)

  if (!ALLOWED_TRANSITIONS[before.status].includes(status)) {
    throw new Error(`Illegal order status transition: ${before.status} -> ${status}`)
  }

  const update: Record<string, unknown> = { status }
  if (status === 'collected') update.collectedAt = new Date().toISOString()
  await ref.update(update)

  await recordAudit({
    actorUid: actor.uid,
    actorEmail: actor.email,
    action: 'order-status',
    collection: 'orders',
    docId: orderId,
    before: { status: before.status },
    after: { status },
  })

  return { ...before, status, ...(status === 'collected' ? { collectedAt: update.collectedAt as string } : {}) }
}

// --- checkout: pending orders + the stock transaction ---

/** Stash a validated cart before redirecting to Stripe Checkout. */
export async function createPendingOrder(
  input: Omit<PendingOrder, 'id' | 'consumed' | 'createdAt' | 'stripeSessionId'>
): Promise<string> {
  const ref = await adminDb()
    .collection('pending_orders')
    .add({ ...input, stripeSessionId: null, consumed: false, createdAt: new Date().toISOString() })
  return ref.id
}

/** Stamp the Stripe session id onto the pending order (for traceability). */
export async function attachSessionToPendingOrder(
  pendingOrderId: string,
  stripeSessionId: string
): Promise<void> {
  await adminDb().collection('pending_orders').doc(pendingOrderId).update({ stripeSessionId })
}

/**
 * Convert a paid Checkout Session into an order, decrementing stock —
 * all inside ONE Firestore transaction:
 *
 *   1. Read the pending order (metadata.pendingOrderId). Already consumed
 *      means this is a Stripe retry — return the existing order.
 *   2. Idempotency backstop: an order with this stripeSessionId already
 *      exists → return it. (The webhook's stripe_events guard is the first
 *      line; this keeps direct calls safe too.)
 *   3. Read every referenced product doc.
 *   4. Validate variants and stock; THROW OrderStockError if any variant
 *      would go negative. The whole transaction then rolls back — payment
 *      succeeded without inventory, which needs a manual refund. The
 *      webhook logs this CRITICAL.
 *   5. Writes: variant stock decrements, the order doc, pending consumed.
 *
 * Firestore requires all reads before all writes in a transaction, hence
 * the strict read/validate/write phases below.
 */
export async function createOrderFromStripeSession(
  session: Pick<Stripe.Checkout.Session, 'id' | 'metadata'>
): Promise<Order> {
  const pendingOrderId = session.metadata?.pendingOrderId
  if (!pendingOrderId) {
    throw new Error(`[shop] merch session ${session.id} is missing metadata.pendingOrderId`)
  }

  const db = adminDb()
  const pendingRef = db.collection('pending_orders').doc(pendingOrderId)
  const orderRef = db.collection('orders').doc()

  return db.runTransaction(async (tx) => {
    // -- reads --
    const pendingSnap = await tx.get(pendingRef)
    const existingBySession = await tx.get(
      db.collection('orders').where('stripeSessionId', '==', session.id).limit(1)
    )

    if (!existingBySession.empty) {
      // Idempotent retry — the order already exists for this session.
      return toOrder(existingBySession.docs[0]!.id, existingBySession.docs[0]!.data())
    }
    if (!pendingSnap.exists) {
      throw new Error(`[shop] pending order ${pendingOrderId} not found for session ${session.id}`)
    }
    const pending = pendingSnap.data()!
    if (pending.consumed === true) {
      // Consumed but no order found — inconsistent state; fail loudly.
      throw new Error(
        `[shop] pending order ${pendingOrderId} already consumed but no order exists for session ${session.id}`
      )
    }
    const items = Array.isArray(pending.items)
      ? pending.items.map(toOrderItem).filter((item): item is OrderItem => item !== null)
      : []
    if (items.length === 0) {
      throw new Error(`[shop] pending order ${pendingOrderId} has no valid items`)
    }

    const productIds = [...new Set(items.map((item) => item.productId))]
    const productSnaps = await Promise.all(
      productIds.map((productId) => tx.get(db.collection('products').doc(productId)))
    )
    const productById = new Map(
      productSnaps
        .filter((snap) => snap.exists)
        .map((snap) => [snap.id, toProduct(snap.id, snap.data()!)] as const)
    )

    // -- validate (throws roll the whole transaction back) --
    for (const item of items) {
      const product = productById.get(item.productId)
      if (!product) {
        throw new OrderStockError(
          `[shop] product ${item.productId} no longer exists (session ${session.id})`,
          { productId: item.productId, variantId: item.variantId, requested: item.qty, available: 0 }
        )
      }
      const variant = product.variants.find((candidate) => candidate.id === item.variantId)
      if (!variant) {
        throw new OrderStockError(
          `[shop] variant ${item.variantId} of product ${item.productId} no longer exists (session ${session.id})`,
          { productId: item.productId, variantId: item.variantId, requested: item.qty, available: 0 }
        )
      }
      if (variant.stock < item.qty) {
        throw new OrderStockError(
          `[shop] insufficient stock for ${product.title} / ${variant.name}: requested ${item.qty}, available ${variant.stock} (session ${session.id}) — PAYMENT WITHOUT INVENTORY, manual refund required`,
          {
            productId: item.productId,
            variantId: item.variantId,
            requested: item.qty,
            available: variant.stock,
          }
        )
      }
    }

    // -- writes --
    for (const item of items) {
      const product = productById.get(item.productId)!
      const variants = product.variants.map((variant) =>
        variant.id === item.variantId ? { ...variant, stock: variant.stock - item.qty } : variant
      )
      tx.update(db.collection('products').doc(item.productId), { variants })
    }

    const orderData = {
      userId: asString(pending.userId),
      email: asString(pending.email) ?? session.metadata?.email ?? '',
      items,
      subtotalCents: asCents(pending.subtotalCents) ?? 0,
      taxCents: asCents(pending.taxCents) ?? 0,
      totalCents: asCents(pending.totalCents) ?? 0,
      stripeSessionId: session.id,
      status: 'paid',
      pickupNotes: PICKUP_NOTES,
      createdAt: new Date().toISOString(),
    }
    tx.set(orderRef, orderData)
    tx.update(pendingRef, { consumed: true })

    return toOrder(orderRef.id, orderData)
  })
}
