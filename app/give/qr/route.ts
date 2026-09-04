import type { NextRequest } from 'next/server'
import { env, has } from '@/lib/env'
import { FUNDS, FUND_LABELS, type Fund } from '@/lib/donations/shared'
import { parseUsdToCents } from '@/lib/money'
import { getStripe } from '@/lib/stripe'

/**
 * QR-code entry point for in-service giving. GET only.
 *
 * Immediately 303-redirects to a hosted Stripe Checkout Session for a
 * one-time gift (Apple Pay / Google Pay are enabled by Checkout
 * automatically). Optional presets: ?amount=50&fund=missions.
 *
 * - amount: human dollars ("50", "25.50"), must be >= $1.
 * - fund: one of the donation funds; defaults to 'general' when omitted.
 * - Missing/invalid amount (or invalid fund) -> redirect to /give, where the
 *   donor can enter everything manually. Checkout requires a fixed price, so
 *   there is no sensible "custom amount" session to fall back to.
 */
export async function GET(request: NextRequest) {
  const giveUrl = new URL('/give', request.url)

  if (!has.stripe()) {
    return Response.redirect(giveUrl, 303)
  }

  const amountParam = request.nextUrl.searchParams.get('amount')
  const fundParam = request.nextUrl.searchParams.get('fund')

  const amountCents = amountParam !== null ? parseUsdToCents(amountParam) : null
  if (amountCents === null || amountCents < 100) {
    return Response.redirect(giveUrl, 303)
  }

  let fund: Fund = 'general'
  if (fundParam !== null) {
    if (!(FUNDS as readonly string[]).includes(fundParam)) {
      return Response.redirect(giveUrl, 303)
    }
    fund = fundParam as Fund
  }

  const siteUrl = env.siteUrl()

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      ui_mode: 'hosted_page',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: { name: `AGM ${FUND_LABELS[fund]} gift` },
          },
        },
      ],
      success_url: `${siteUrl}/give/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/give`,
      payment_intent_data: {
        metadata: {
          fund,
          donorEmail: '',
          coveredFee: 'false',
          source: 'qr',
          baseAmountCents: String(amountCents),
          feeCents: '0',
        },
      },
      metadata: { fund, source: 'qr' },
    })

    if (!session.url) {
      return Response.redirect(giveUrl, 303)
    }
    return Response.redirect(session.url, 303)
  } catch (error) {
    console.error('[give/qr] checkout session failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.redirect(giveUrl, 303)
  }
}
