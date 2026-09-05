import { z } from 'zod'
import { has } from '@/lib/env'
import {
  FREQUENCIES,
  FUNDS,
  FUND_LABELS,
  FREQUENCY_LABELS,
  RECURRING_INTERVALS,
  type IntentResponse,
} from '@/lib/donations/shared'
import { chargeTotalCents, feeCents } from '@/lib/money'
import { getProjectBySlug } from '@/lib/projects'
import { getStripe } from '@/lib/stripe'

/**
 * Creates the Stripe object the give page confirms against. POST only.
 *
 * - zod-validated body; the client sends amount/fund/frequency/coverFee,
 *   NEVER a total — the charge total is computed here.
 * - Naive in-memory per-IP rate limit: 10 intents per hour.
 * - one-time  -> PaymentIntent; response { clientSecret, totalCents, feeCents }
 * - recurring -> find-or-create Customer by email (email required) and a
 *   Subscription (default_incomplete); response also includes subscriptionId.
 *   The client secret comes from the invoice's confirmation_secret — in this
 *   API version (2026-08-26.dahlia) `Invoice.payment_intent` no longer exists.
 */

const intentSchema = z.object({
  amountCents: z.number().int().min(100, 'The minimum gift is $1.'),
  fund: z.enum(FUNDS, 'Please choose a valid fund.'),
  frequency: z.enum(FREQUENCIES, 'Please choose a valid frequency.'),
  coverFee: z.boolean(),
  email: z.email('Please enter a valid email address.').optional(),
  source: z.enum(['web', 'qr']).default('web'),
  /** Optional funding-project designation (from /give?project=<slug>). */
  projectSlug: z.string().trim().min(1).max(200).optional(),
})

const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60 * 60 * 1000

type RateEntry = { count: number; resetAt: number }

// Per server instance — intentionally naive; good enough to blunt drive-by abuse.
const globalStore = globalThis as typeof globalThis & {
  __donationIntentRateLimit?: Map<string, RateEntry>
}
const hits = (globalStore.__donationIntentRateLimit ??= new Map<string, RateEntry>())

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > RATE_LIMIT
}

function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

// Subscription price_data requires an existing Product in this API version
// (inline product_data was removed from subscription items). Find-or-create
// one per fund+frequency; the cache avoids a search on every gift.
const productCache = new Map<string, string>()

async function donationProductId(name: string): Promise<string> {
  const cached = productCache.get(name)
  if (cached) return cached
  const stripe = getStripe()
  const found = await stripe.products.search({ query: `name:'${name}'`, limit: 1 })
  const product = found.data[0] ?? (await stripe.products.create({ name }))
  productCache.set(name, product.id)
  return product.id
}

export async function POST(request: Request) {
  if (!has.stripe()) {
    return errorResponse('Online giving is not available yet. Please give in person or contact us.', 503)
  }

  if (isRateLimited(clientIp(request))) {
    return errorResponse('Too many attempts. Please wait a while and try again.', 429)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid request body.', 400)
  }

  const parsed = intentSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid donation details.'
    return errorResponse(message, 400)
  }

  const { amountCents, fund, frequency, coverFee, email, source, projectSlug } = parsed.data

  if (frequency !== 'one-time' && !email) {
    return errorResponse('An email address is required for recurring gifts.', 400)
  }

  // A designated gift must name a real, currently-active project; its id —
  // resolved here, never trusted from the client — rides in the metadata so
  // the webhook can credit the campaign (spec §7.4).
  let projectId: string | null = null
  if (projectSlug) {
    try {
      const project = await getProjectBySlug(projectSlug)
      if (!project || project.status !== 'active') {
        return errorResponse('This project is not accepting gifts right now.', 400)
      }
      projectId = project.id
    } catch (error) {
      console.error('[donations] project lookup failed', {
        projectSlug,
        message: error instanceof Error ? error.message : 'unknown',
      })
      return errorResponse('Something went wrong starting your gift. Please try again.', 502)
    }
  }

  // Server computes the charge total — the client's total is never trusted.
  const fee = coverFee ? feeCents(amountCents) : 0
  const totalCents = chargeTotalCents(amountCents, coverFee)

  const metadata = {
    fund,
    donorEmail: email ?? '',
    coveredFee: String(coverFee),
    source,
    baseAmountCents: String(amountCents),
    feeCents: String(fee),
    ...(projectId && projectSlug ? { projectId, projectSlug } : {}),
  }

  const stripe = getStripe()

  try {
    if (frequency === 'one-time') {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalCents,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        ...(email ? { receipt_email: email } : {}),
        metadata,
      })
      if (!paymentIntent.client_secret) {
        return errorResponse('Could not start the payment. Please try again.', 502)
      }
      const response: IntentResponse = {
        clientSecret: paymentIntent.client_secret,
        totalCents,
        feeCents: fee,
      }
      return Response.json(response)
    }

    // Recurring: find-or-create the customer, then a default_incomplete
    // subscription whose first invoice provides the client secret.
    const existing = await stripe.customers.list({ email: email!, limit: 1 })
    const customer =
      existing.data[0] ?? (await stripe.customers.create({ email: email!, metadata: { source } }))

    const { interval, interval_count } = RECURRING_INTERVALS[frequency]
    const productId = await donationProductId(
      `AGM ${FUND_LABELS[fund]} ${FREQUENCY_LABELS[frequency]} gift`
    )
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: totalCents,
            recurring: { interval, interval_count },
            product: productId,
          },
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      metadata,
      expand: ['latest_invoice.confirmation_secret'],
    })

    const invoice = subscription.latest_invoice
    const clientSecret =
      typeof invoice === 'object' && invoice !== null
        ? invoice.confirmation_secret?.client_secret
        : null
    if (!clientSecret) {
      return errorResponse('Could not start the subscription payment. Please try again.', 502)
    }

    const response: IntentResponse = {
      clientSecret,
      subscriptionId: subscription.id,
      totalCents,
      feeCents: fee,
    }
    return Response.json(response)
  } catch (error) {
    console.error('[donations] intent creation failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return errorResponse('Something went wrong starting your gift. Please try again.', 502)
  }
}
